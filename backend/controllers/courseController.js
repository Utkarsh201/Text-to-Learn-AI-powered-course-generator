import prisma from '../prisma/client.js';
import courseQueue from '../services/courseQueue.js';

const VALID_DEPTHS = new Set(['OVERVIEW', 'BASIC', 'DETAILED']);
const VALID_LANGUAGES = new Set(['ENGLISH', 'HINDI']);
const normalizeEnum = (value) => (typeof value === 'string' ? value.trim().toUpperCase() : '');

// generate the course work is to 
// 1. create a course in the database
// 2. create a generation run in the database
// 3. enqueue a job to process the course
// 4. 

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

    // Enqueue after DB commit; on enqueue failure, mark run as FAILED for clean recovery.
    await courseQueue.add(
      'course-job',
      {
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
      {
        jobId: `outline-${generationRun.id}`,
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

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

    res.json({
      status: run.status,
      error: run.error,
      completedAt: run.completedAt,
    });
  } catch (error) {
    console.error('Error fetching generation status:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── GET /api/courses ──
// Returns a paginated list of courses for the authenticated user,
// including generation status and option flags.
export const getUserCourses = async (req, res) => {
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

    // Pagination: page (1-based), limit (default 20, max 50)
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          topic: true,
          title: true,
          description: true,
          depth: true,
          language: true,
          estimatedDuration: true,
          includeQuizzes: true,
          includeVideoReferences: true,
          includePdfDownload: true,
          createdAt: true,
          generationRun: {
            select: { status: true, error: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.course.count({ where: { userId: user.id } }),
    ]);

    res.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching user courses:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── GET /api/courses/:courseId ──
// Returns a single course with full nested content.
// Quiz answers and explanations are HIDDEN — use the reveal endpoint instead.
export const getCourseById = async (req, res) => {
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

    const { courseId } = req.params;
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: user.id },
      include: {
        generationRun: {
          select: { status: true, error: true },
        },
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                videoReferences: true,
                quiz: {
                  include: {
                    questions: {
                      select: {
                        id: true,
                        type: true,
                        question: true,
                        options: true,
                        difficulty: true,
                        // answer and explanation intentionally excluded
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    res.json(course);
  } catch (error) {
    console.error('Error fetching course by ID:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── GET /api/courses/:courseId/quiz/:quizId/reveal ──
// Returns quiz questions with answers and explanations.
// This is the only endpoint that exposes correct answers.
export const revealQuizAnswers = async (req, res) => {
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

    const { courseId, quizId } = req.params;

    // Verify the course belongs to this user
    const course = await prisma.course.findFirst({
      where: { id: courseId, userId: user.id },
      select: { id: true },
    });
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Fetch quiz with full answers — verify it belongs to a lesson in this course
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        lesson: { chapter: { courseId: course.id } },
      },
      include: {
        questions: {
          select: {
            id: true,
            type: true,
            question: true,
            options: true,
            answer: true,
            explanation: true,
            difficulty: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Error revealing quiz answers:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
