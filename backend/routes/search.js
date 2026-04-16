import express from 'express';
import { checkJwt } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import { handleTextSearch, handleVoiceSearch } from '../controllers/searchController.js';

const router = express.Router();

// 1. Search Bar Route (Protected)
// Example usage: POST /api/search/text
router.post('/text', checkJwt, handleTextSearch);

// 2. Voice Search Route (Protected)
// Accepts audio file via multipart/form-data with field name "audio"
// Flow: checkJwt verifies the token -> upload.single('audio') parses the audio file into req.file -> handleVoiceSearch transcribes it
// Example usage: POST /api/search/voice with form-data containing an "audio" field
router.post('/voice', checkJwt, upload.single('audio'), handleVoiceSearch);

export default router;
