import prisma from '../prisma/client.js';

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
