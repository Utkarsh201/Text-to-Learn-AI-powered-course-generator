import { Receiver } from "@upstash/qstash";
import prisma from "../prisma/client.js";
import qstashClient from "../services/qstashClient.js";
import {
  generateCourseOutline,
  generateLessonContent,
  generateQuiz,
} from "../services/llmService.js";

// ── QStash Signature Verification ──
// Every request from QStash includes a signature header.
// We verify it so random attackers can't trigger our webhook.
const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
});

/**
 * Publish a job step to QStash.
 * QStash will POST the payload back to our webhook endpoint.
 */
const publishStep = async (payload) => {
  const callbackUrl = `${process.env.QSTASH_CALLBACK_URL}/api/webhooks/course`;

  await qstashClient.publishJSON({
    url: callbackUrl,
    body: payload,
    retries: 3,
  });
};

/**
 * Main webhook handler — receives HTTP POST from QStash for each step.
 *
 * Each step (generateOutline, generateChapter, generateQuiz) is its own
 * HTTP request. If a step fails, QStash retries ONLY that step — already
 * completed steps (saved in Postgres) are never re-executed.
 */
export const handleCourseWebhook = async (req, res) => {
  try {
    // ── Step 1: Verify QStash signature ──
    const signature = req.headers["upstash-signature"];
    if (!signature) {
      return res.status(401).json({ error: "Missing QStash signature" });
    }

    const isValid = await receiver.verify({
      signature,
      body: req.rawBody ?? JSON.stringify(req.body),
    });

    if (!isValid) {
      return res.status(401).json({ error: "Invalid QStash signature" });
    }
  } catch (verifyError) {
    console.error("[Webhook] Signature verification failed:", verifyError.message);
    return res.status(401).json({ error: "Signature verification failed" });
  }

  // ── Step 2: Extract job data ──
  const {
    type,
    generationRunId,
    courseId,
    topic,
    depth,
    chapterId,
    chapterTitle,
    chapterObjective,
    expectedChapterCount,
    lessonContent,
  } = req.body;

  try {
    // ────────────────────────────────────────────────
    // STEP TYPE: generateOutline
    // ────────────────────────────────────────────────
    if (type === "generateOutline") {
      console.log(`[Webhook] Generating outline for course: ${courseId}`);

      await prisma.generationRun.update({
        where: { id: generationRunId },
        data: { status: "RUNNING" },
      });

      // ── Idempotency check ──
      // If this is a QStash retry, chapters may already exist from a previous
      // partial attempt. Check first to avoid duplicates.
      const existingChapters = await prisma.chapter.findMany({
        where: { courseId },
        include: { lessons: true },
        orderBy: { order: "asc" },
      });

      if (existingChapters.length > 0) {
        // Chapters already exist — skip LLM call and chapter creation.
        // Only re-enqueue chapter jobs for chapters that don't have lessons yet.
        console.log(
          `[Webhook] Retry detected: ${existingChapters.length} chapters already exist. Re-enqueuing incomplete ones.`
        );

        for (const chapter of existingChapters) {
          if (chapter.lessons.length === 0) {
            await publishStep({
              type: "generateChapter",
              generationRunId,
              courseId,
              chapterId: chapter.id,
              expectedChapterCount: existingChapters.length,
              topic,
              chapterTitle: chapter.title,
              chapterObjective: chapter.objective,
            });
          }
        }

        return res.status(200).json({
          success: true,
          message: "Retry: re-enqueued incomplete chapters",
        });
      }

      // ── First attempt: generate outline from LLM ──
      const {
        title: courseTitle,
        description: courseDescription,
        estimatedDuration,
        chapters: outline,
      } = await generateCourseOutline(topic, depth);

      if (!outline || outline.length === 0) {
        throw new Error("LLM returned an empty outline. Aborting.");
      }

      // Persist course-level metadata from the LLM
      await prisma.course.update({
        where: { id: courseId },
        data: {
          title: courseTitle || topic,
          description: courseDescription || null,
          estimatedDuration: estimatedDuration || null,
        },
      });

      // Create chapters and enqueue each as a separate QStash step
      for (const [index, chapter] of outline.entries()) {
        const createdChapter = await prisma.chapter.create({
          data: {
            title: chapter.title,
            objective: chapter.objective,
            order: index + 1,
            courseId,
          },
        });

        // Each chapter becomes its own independent QStash job
        // If chapter 3 fails, chapters 1 & 2 are already saved — no re-work
        await publishStep({
          type: "generateChapter",
          generationRunId,
          courseId,
          chapterId: createdChapter.id,
          expectedChapterCount: outline.length,
          topic,
          chapterTitle: chapter.title,
          chapterObjective: chapter.objective,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Outline generated and chapters queued",
      });
    }

    // ────────────────────────────────────────────────
    // STEP TYPE: generateChapter
    // ────────────────────────────────────────────────
    if (type === "generateChapter") {
      console.log(`[Webhook] Generating content for chapter: ${chapterTitle}`);

      const contentData = await generateLessonContent(
        topic,
        chapterTitle,
        chapterObjective
      );

      // Upsert pattern: if a lesson already exists (from a previous
      // delivery attempt), update it instead of creating a duplicate.
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

      // ── Check if all chapters are done ──
      const chapterCount = Number.isInteger(expectedChapterCount)
        ? expectedChapterCount
        : await prisma.chapter.count({ where: { courseId } });

      const chaptersWithLessons = await prisma.chapter.findMany({
        where: { courseId },
        include: { lessons: true },
      });
      const finishedChapters = chaptersWithLessons.filter(
        (ch) => ch.lessons.length > 0
      ).length;

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
            data: { status: "COMPLETED", completedAt: new Date(), error: null },
          });
          console.log(
            `[Webhook] Quiz disabled. Run ${generationRunId} marked COMPLETED.`
          );
          return res.status(200).json({
            success: true,
            message: `All chapters completed; run finalized without quiz`,
          });
        }

        console.log(
          `[Webhook] All chapters done for course ${courseId}. Queueing quiz.`
        );

        const allLessons = await prisma.lesson.findMany({
          where: { chapter: { courseId } },
          orderBy: { order: "asc" },
        });
        const fullContent = allLessons
          .map((lesson) => lesson.content)
          .join("\n\n");

        await publishStep({
          type: "generateQuiz",
          generationRunId,
          courseId,
          topic,
          lessonContent: fullContent,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Chapter ${chapterTitle} completed`,
      });
    }

    // ────────────────────────────────────────────────
    // STEP TYPE: generateQuiz
    // ────────────────────────────────────────────────
    if (type === "generateQuiz") {
      console.log(`[Webhook] Generating quiz for course: ${courseId}`);

      const quizQuestions = await generateQuiz(topic, lessonContent);
      if (!Array.isArray(quizQuestions)) {
        throw new Error(
          "Quiz generator returned invalid format (expected an array)."
        );
      }

      const validQuestions = quizQuestions.filter((q) => {
        return (
          q &&
          typeof q.question === "string" &&
          q.question.trim() &&
          Array.isArray(q.options) &&
          q.options.length > 0 &&
          typeof q.answer === "string" &&
          q.answer.trim()
        );
      });

      if (validQuestions.length === 0) {
        throw new Error("LLM returned no valid quiz questions.");
      }

      const firstLesson = await prisma.lesson.findFirst({
        where: { chapter: { courseId } },
        orderBy: { createdAt: "asc" },
      });
      if (!firstLesson) {
        throw new Error("Cannot generate quiz: No lessons exist.");
      }

      // Upsert quiz — safe for duplicate deliveries
      let createdQuiz = await prisma.quiz.findUnique({
        where: { lessonId: firstLesson.id },
      });
      if (!createdQuiz) {
        createdQuiz = await prisma.quiz.create({
          data: { lessonId: firstLesson.id },
        });
      }

      // Clear any existing questions (idempotent: re-delivery replaces, not duplicates)
      await prisma.quizQuestion.deleteMany({
        where: { quizId: createdQuiz.id },
      });

      for (const question of validQuestions) {
        await prisma.quizQuestion.create({
          data: {
            quizId: createdQuiz.id,
            type: question.type || "MCQ",
            question: question.question,
            options: question.options,
            answer: question.answer,
            explanation: question.explanation,
            difficulty: question.difficulty || "Normal",
          },
        });
      }

      await prisma.generationRun.update({
        where: { id: generationRunId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      console.log(
        `[Webhook] Completely finished generation run for course ${courseId}.`
      );
      return res.status(200).json({
        success: true,
        message: "Quiz generated and course run completed!",
      });
    }

    // Unknown type
    return res.status(400).json({ error: `Unknown job type: ${type}` });
  } catch (error) {
    console.error(`[Webhook] Error during [${type}]:`, error);

    // QStash sends the current retry count in the `upstash-retried` header.
    // We configured retries: 3 when publishing, so max retried value is 3.
    // Only mark as FAILED on the FINAL attempt — otherwise QStash will retry
    // and the next attempt can succeed, naturally resetting the status.
    const retriedCount = parseInt(req.headers["upstash-retried"] || "0", 10);
    const maxRetries = 3;
    const isLastAttempt = retriedCount >= maxRetries;

    if (generationRunId) {
      try {
        if (isLastAttempt) {
          // Final attempt failed — mark as permanently FAILED
          await prisma.generationRun.update({
            where: { id: generationRunId },
            data: {
              status: "FAILED",
              error: error.message,
              completedAt: new Date(),
            },
          });
          console.error(
            `[Webhook] Final retry exhausted for run ${generationRunId}. Marked FAILED.`
          );
        } else {
          // Transient failure — log error but keep status as RUNNING
          // so the next retry can pick up where it left off
          await prisma.generationRun.update({
            where: { id: generationRunId },
            data: {
              error: `Retrying [${type}] (attempt ${retriedCount + 1}/${maxRetries + 1}): ${error.message}`,
            },
          });
          console.log(
            `[Webhook] Transient error on run ${generationRunId}. QStash will retry (${retriedCount + 1}/${maxRetries + 1}).`
          );
        }
      } catch (markError) {
        console.error(
          `[Webhook] Failed to update status for run ${generationRunId}:`,
          markError.message
        );
      }
    }

    // Return 500 so QStash knows to retry this step
    return res.status(500).json({ error: error.message });
  }
};
