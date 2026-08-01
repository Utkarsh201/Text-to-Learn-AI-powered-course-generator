import prisma from '../prisma/client.js';
import qstashClient from '../services/qstashClient.js';

const VALID_DEPTHS = new Set(['OVERVIEW', 'BASIC', 'DETAILED']);
const VALID_LANGUAGES = new Set(['ENGLISH', 'HINDI']);
const normalizeEnum = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');

// generate the course work is to 
// 1. create a course in the database
// 2. create a generation run in the database
// 3. enqueue a job to process the course
export const generateCourse = async (req, res) => {
  let generationRunId = null;

  try {
    const { 
      topic, 
      depth = 'OVERVIEW', 
      language = 'ENGLISH', 
      options = {}
    } = req.body;
    const safeOptions = options ?? {};
    
    // The.sub stands for "Subject".
    // In the world of JWT(JSON Web Tokens), sub is a standard, reserved field(or "claim") defined by the official JWT specification.It is essentially the unique ID of the user that the token was issued for.
    const auth0Id = req.auth?.payload?.sub;
    if (!auth0Id) {
      console.log("User is not authenticated");
      return res.status(401).json({ error: 'Valid access token is required.' });
    }

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Topic is required.' });
    }

    const normalizedDepth = normalizeEnum(depth);
    if (!VALID_DEPTHS.has(normalizedDepth)) {
      return res.status(400).json({
        error: 'Invalid depth value.',
        allowedValues: Array.from(VALID_DEPTHS),
      });
    }

    const normalizedLanguage = normalizeEnum(language);
    if (!VALID_LANGUAGES.has(normalizedLanguage)) {
      return res.status(400).json({
        error: 'Invalid language value.',
        allowedValues: Array.from(VALID_LANGUAGES),
      });
    }

    if (typeof safeOptions !== 'object' || Array.isArray(safeOptions)) {
      return res.status(400).json({ error: 'options must be an object.' });
    }

    const includeQuizzes = safeOptions.quiz ?? true;
    const includePdfDownload = safeOptions.pdf ?? true;
    const includeVideoReferences = safeOptions.videoReferences ?? true;

    if (typeof includeQuizzes !== 'boolean') {
      return res.status(400).json({ error: 'options.quiz must be true or false.' });
    }
    if (typeof includePdfDownload !== 'boolean') {
      return res.status(400).json({ error: 'options.pdf must be true or false.' });
    }
    if (typeof includeVideoReferences !== 'boolean') {
      return res.status(400).json({ error: 'options.videoReferences must be true or false.' });
    }

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      return res.status(404).json({
        error: 'User profile not found. Complete login/profile sync first.',
      });
    }

    // Keep course + run creation atomic so we do not leave inconsistent records.
    // Using an interactive transaction so we can pass course.id into the GenerationRun.
    const { course, generationRun } = await prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          userId: user.id,
          topic: topic.trim(),
          depth: normalizedDepth,
          language: normalizedLanguage,
          includeQuizzes,
          includeVideoReferences,
          includePdfDownload,
        },
      });

      const generationRun = await tx.generationRun.create({
        data: {
          userId: user.id,
          courseId: course.id, // link run to the course
          topic: topic.trim(),
          depth: normalizedDepth,
          language: normalizedLanguage,
          includeQuizzes,
          includeVideoReferences,
          includePdfDownload,
          status: 'PENDING',
        },
      });

      return { course, generationRun };
    });
    generationRunId = generationRun.id;

    // Publish to QStash — it will POST back to our webhook endpoint
    if (!process.env.QSTASH_CALLBACK_URL) {
      throw new Error(
        'QSTASH_CALLBACK_URL is not set. Add it to your .env file (e.g. your ngrok or deployed URL).'
      );
    }
    const callbackUrl = `${process.env.QSTASH_CALLBACK_URL}/api/webhooks/course`;

    await qstashClient.publishJSON({
      url: callbackUrl,
      body: {
        type: 'generateOutline',
        generationRunId: generationRun.id,
        courseId: course.id,
        topic: course.topic,
        depth: course.depth,
        language: course.language,
        includeQuizzes: generationRun.includeQuizzes,
        includeVideoReferences: generationRun.includeVideoReferences,
        includePdfDownload: generationRun.includePdfDownload,
      },
      retries: 3,
    });

    res.status(202).json({
      message: 'Course generation successfully queued',
      courseId: course.id,
      generationRunId: generationRun.id,
    });
  } catch (error) {
    console.error('Error producing course generation job:', error);

    if (generationRunId) {
      try {
        await prisma.generationRun.update({
          where: { id: generationRunId },
          data: {
            status: 'FAILED',
            error: `Queue enqueue failed: ${error.message}`,
            completedAt: new Date(),
          },
        });
      } catch (markError) {
        console.error('Failed to mark generation run as FAILED:', markError.message);
      }
    }

    res.status(500).json({ error: 'Failed to start generation.' });
  }
};

export const getGenerationStatus = async (req, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub;
    if (!auth0Id) {
      return res.status(401).json({ error: 'Valid access token is required.' });
    }

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) {
      return res.status(404).json({
        error: 'User profile not found. Complete login/profile sync first.',
      });
    }

    const { runId } = req.params;
    const run = await prisma.generationRun.findFirst({
      where: {
        id: runId,
        userId: user.id,
      },
    });

    if (!run) {
      return res.status(404).json({ error: 'Generation run not found.' });
    }

    // Compute qualitative progress milestones without raw chapter numbers
    let progressPercent = 10;
    let progressStage = 'STARTING';
    let progressMessage = 'Warming up the AI intelligence engine...';

    if (run.status === 'COMPLETED') {
      progressPercent = 100;
      progressStage = 'COMPLETED';
      progressMessage = 'Your course is ready!';
    } else if (run.status === 'FAILED') {
      progressPercent = 0;
      progressStage = 'FAILED';
      progressMessage = run.error || 'Generation failed';
    } else if (run.status === 'RUNNING') {
      if (run.courseId) {
        const chapters = await prisma.chapter.findMany({
          where: { courseId: run.courseId },
          include: { _count: { select: { lessons: true } } },
        });

        const totalChapters = chapters.length;
        const finishedChapters = chapters.filter((c) => c._count.lessons > 0).length;

        if (totalChapters === 0) {
          progressPercent = 20;
          progressStage = 'DRAFTING_ROADMAP';
          progressMessage = 'Drafting course roadmap & lesson foundations...';
        } else {
          const ratio = finishedChapters / totalChapters;
          progressPercent = Math.min(96, Math.round(30 + ratio * 65));

          if (ratio === 0) {
            progressStage = 'DRAFTING_ROADMAP';
            progressMessage = 'Drafting course roadmap & lesson foundations...';
          } else if (ratio < 0.4) {
            progressStage = 'PROGRESSING';
            progressMessage = 'Synthesizing foundational concepts and structure...';
          } else if (ratio < 0.7) {
            progressStage = 'HALFWAY';
            progressMessage = 'Halfway there! Synthesizing core concepts and insights...';
          } else if (ratio < 0.95) {
            progressStage = 'ALMOST_DONE';
            progressMessage = 'Almost done! Crafting custom quizzes and study summaries...';
          } else {
            progressStage = 'FINISHING';
            progressMessage = 'Adding finishing touches to your learning guide...';
          }
        }
      } else {
        progressPercent = 25;
        progressStage = 'DRAFTING_ROADMAP';
        progressMessage = 'Drafting course roadmap & lesson foundations...';
      }
    }

    res.json({
      status: run.status,
      error: run.error,
      completedAt: run.completedAt,
      progressPercent,
      progressStage,
      progressMessage,
    });
  } catch (error) {
    console.error('Error fetching generation status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
