import express from 'express';
import { generateCourse, getGenerationStatus, getUserCourses, getCourseById, revealQuizAnswers } from '../controllers/courseController.js';
import { checkJwt } from '../middlewares/auth.js';

const router = express.Router();

// The POST route that acts as the Producer for the Queue
router.post('/generate', checkJwt, generateCourse);

// The GET route used by frontend to poll for progress updates
router.get('/status/:runId', checkJwt, getGenerationStatus);

// ── Course content retrieval ──

// Get all courses for the authenticated user (paginated)
router.get('/', checkJwt, getUserCourses);

// Get a single course with full content (quiz answers hidden)
router.get('/:courseId', checkJwt, getCourseById);

// Reveal quiz answers for a specific quiz in a course
router.get('/:courseId/quiz/:quizId/reveal', checkJwt, revealQuizAnswers);

export default router;
