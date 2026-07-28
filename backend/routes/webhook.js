import express from 'express';
import { handleCourseWebhook } from '../controllers/webhookHandler.js';

const router = express.Router();

// QStash delivers job steps here via HTTP POST
// This is NOT behind Auth0 (checkJwt) — it uses QStash signature verification instead
router.post('/course', handleCourseWebhook);

export default router;
