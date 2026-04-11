import express from 'express';
import { checkJwt } from '../middlewares/auth.js';
import { handleTextSearch, handleVoiceSearch } from '../controllers/searchController.js';

const router = express.Router();

// 1. Search Bar Route (Protected)
// Example usage: POST /api/search/text
router.post('/text', checkJwt, handleTextSearch);

// 2. Voice Chat Route (Protected)
// Example usage: POST /api/search/voice
router.post('/voice', checkJwt, handleVoiceSearch);

export default router;
