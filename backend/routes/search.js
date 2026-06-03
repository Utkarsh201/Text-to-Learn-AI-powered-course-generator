import express from 'express';
import { checkJwt } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import { handleVoiceSearch } from '../controllers/searchController.js';

const router = express.Router();

// Voice Search Route (Protected)
// Accepts audio file via multipart/form-data with field name "audio"
// Flow: checkJwt verifies the token -> upload.single('audio') parses the audio file into req.file -> handleVoiceSearch transcribes it
// Returns: { text: "transcribed text" } for the frontend to display in the search bar
router.post('/voice', checkJwt, upload.single('audio'), handleVoiceSearch);

export default router;
