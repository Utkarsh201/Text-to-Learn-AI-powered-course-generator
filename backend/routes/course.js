import express from 'express';
import { generateCourse, getGenerationStatus } from '../controllers/courseController.js';
import { checkJwt } from '../middlewares/auth.js';

const router = express.Router();

// The POST route that acts as the Producer for the Queue
router.post('/generate', checkJwt, generateCourse);

// The GET route used by frontend to poll for progress updates
router.get('/status/:runId', checkJwt, getGenerationStatus);

export default router;
