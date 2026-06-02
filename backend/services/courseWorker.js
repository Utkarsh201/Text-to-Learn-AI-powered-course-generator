import { Worker } from 'bullmq';
import courseQueue, { connection } from './courseQueue.js';
import prisma from '../utils/prisma.js';
import { generateCourseOutline, generateLessonContent, generateQuiz } from './llmService.js';

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: true,
  removeOnFail: false,
};

// Worker to process the course generation jobs asynchronously
// BullMQ separates the Worker from the Queue — each gets its own Redis connection.
const courseWorker = new Worker(
  'course-generation-queue',
  async (job) => {
    const { type, generationRunId, courseId, topic, depth, chapterTitle, chapterObjective, lessonContent } = job.data;

    try {
      if (type === 'generateOutline') {
        console.log(`[Worker] Started generating outline for course: ${courseId}`);

        await prisma.generationRun.update({
          where: { id: generationRunId },
          data: { status: 'RUNNING' },
        });

        const outline = await generateCourseOutline(topic, depth);
        if (!outline || outline.length === 0) {
          throw new Error('LLM returned an empty outline. Aborting to prevent hang.');
        }

        for (const [index, chapter] of outline.entries()) {
          const createdChapter = await prisma.chapter.create({
            data: {
              title: chapter.title,
              objective: chapter.objective,
              order: index + 1,
              courseId,
            },
          });

          await courseQueue.add(
            'course-job',
            {
              type: 'generateChapter',
              generationRunId,
              courseId,
              chapterId: createdChapter.id,
              topic,
              chapterTitle: chapter.title,
              chapterObjective: chapter.objective,
            },
            {
              ...DEFAULT_JOB_OPTIONS,
              jobId: `chapter-${createdChapter.id}`,
            }
          );
        }

        return { success: true, message: 'Outline generated and chapters queued for processing' };
      }

      if (type === 'generateChapter') {
        const { chapterId } = job.data;
        console.log(`[Worker] Started content for chapter: ${chapterTitle}`);

        const contentData = await generateLessonContent(topic, chapterTitle, chapterObjective);
        const existingLesson = await prisma.lesson.findFirst({
          where: { chapterId, order: 1 },
          select: { id: true },
        });

        if (existingLesson) {
          await prisma.lesson.update({
            where: { id: existingLesson.id },
            data: {
              title: chapterTitle,
              content: contentData.content,
              keyTakeaways: contentData.keyTakeaways || [],
            },
          });
        } else {
          await prisma.lesson.create({
            data: {
              title: chapterTitle,
              content: contentData.content,
              keyTakeaways: contentData.keyTakeaways || [],
              order: 1,
              chapterId,
            },
          });
        }

        const chapterCount = await prisma.chapter.count({ where: { courseId } });
        const chaptersWithLessons = await prisma.chapter.findMany({
          where: { courseId },
          include: { lessons: true },
        });
        const finishedChapters = chaptersWithLessons.filter((chapter) => chapter.lessons.length > 0).length;

        if (finishedChapters === chapterCount) {
          const run = await prisma.generationRun.findUnique({
            where: { id: generationRunId },
            select: { includeQuizzes: true },
          });

          if (!run) {
            throw new Error(`Generation run not found: ${generationRunId}`);
          }

          if (!run.includeQuizzes) {
            await prisma.generationRun.update({
              where: { id: generationRunId },
              data: { status: 'COMPLETED', completedAt: new Date() },
            });

            console.log(`[Worker] Quiz disabled. Run ${generationRunId} marked COMPLETED.`);
            return {
              success: true,
              message: `Chapter ${chapterTitle} completed; run finalized without quiz`,
            };
          }

          console.log(`[Worker] All chapters completed for course ${courseId}. Queueing quiz.`);

          const allLessons = await prisma.lesson.findMany({
            where: { chapter: { courseId } },
            orderBy: { order: 'asc' },
          });
          const fullContent = allLessons.map((lesson) => lesson.content).join('\n\n');

          try {
            await courseQueue.add(
              'course-job',
              {
                type: 'generateQuiz',
                generationRunId,
                courseId,
                topic,
                lessonContent: fullContent,
              },
              {
                ...DEFAULT_JOB_OPTIONS,
                jobId: `quiz-${generationRunId}`,
              }
            );
          } catch (queueError) {
            const msg = String(queueError?.message || '').toLowerCase();
            if (msg.includes('job') && msg.includes('exists')) {
              console.log(`[Worker] Quiz job already exists for run ${generationRunId}, skipping duplicate enqueue.`);
            } else {
              throw queueError;
            }
          }
        }

        return { success: true, message: `Chapter ${chapterTitle} completed` };
      }

      if (type === 'generateQuiz') {
        console.log(`[Worker] Started quiz for course: ${courseId}`);

        const quizQuestions = await generateQuiz(topic, lessonContent);
        if (!Array.isArray(quizQuestions)) {
          throw new Error('Quiz generator returned invalid format (expected an array).');
        }

        const validQuestions = quizQuestions.filter((question) => {
          return (
            question &&
            typeof question.question === 'string' &&
            question.question.trim() &&
            Array.isArray(question.options) &&
            question.options.length > 0 &&
            typeof question.answer === 'string' &&
            question.answer.trim()
          );
        });

        if (validQuestions.length === 0) {
          throw new Error('LLM returned no valid quiz questions.');
        }

        const firstLesson = await prisma.lesson.findFirst({
          where: { chapter: { courseId } },
          orderBy: { createdAt: 'asc' },
        });
        if (!firstLesson) {
          throw new Error('Cannot generate quiz: No lessons exist to attach it to.');
        }

        let createdQuiz = await prisma.quiz.findUnique({
          where: { lessonId: firstLesson.id },
        });
        if (!createdQuiz) {
          createdQuiz = await prisma.quiz.create({
            data: { lessonId: firstLesson.id },
          });
        }

        await prisma.quizQuestion.deleteMany({
          where: { quizId: createdQuiz.id },
        });

        for (const question of validQuestions) {
          await prisma.quizQuestion.create({
            data: {
              quizId: createdQuiz.id,
              type: question.type || 'MCQ',
              question: question.question,
              options: question.options,
              answer: question.answer,
              explanation: question.explanation,
              difficulty: question.difficulty || 'Normal',
            },
          });
        }

        await prisma.generationRun.update({
          where: { id: generationRunId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });

        console.log(`[Worker] Completely finished generation run for course ${courseId}.`);
        return { success: true, message: 'Quiz generated and course run completed!' };
      }

      throw new Error(`Unknown job type: ${type}`);
    } catch (error) {
      console.error(`[Worker] Error during [${type}] execution:`, error);

      if (generationRunId) {
        const maxAttempts = job.opts?.attempts || 1;
        const willRetry = job.attemptsMade + 1 < maxAttempts;

        try {
          if (willRetry) {
            await prisma.generationRun.update({
              where: { id: generationRunId },
              data: {
                status: 'RUNNING',
                error: `Retrying ${type} (${job.attemptsMade + 1}/${maxAttempts}): ${error.message}`,
                completedAt: null,
              },
            });
          } else {
            await prisma.generationRun.update({
              where: { id: generationRunId },
              data: { status: 'FAILED', error: error.message, completedAt: new Date() },
            });
          }
        } catch (markError) {
          console.error(`[Worker] Failed to update status for run ${generationRunId}:`, markError.message);
        }
      }

      throw error;
    }
  },
  {
    connection,
    concurrency: 10,
  }
);

// Event listeners for logging queue health
// In BullMQ, events live on the Worker, not the Queue
courseWorker.on('completed', () => {
  // Intentionally silent in normal flow
});

courseWorker.on('failed', (job, err) => {
  const jobId = job?.id ?? 'unknown';
  const jobType = job?.data?.type ?? 'unknown';
  const message = err?.message ?? 'Unknown worker error';
  console.log(`[Queue Event] Critical fail on job ${jobId} type ${jobType}:`, message);
});

export default courseWorker;
