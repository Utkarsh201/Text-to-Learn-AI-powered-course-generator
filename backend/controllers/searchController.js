import { transcribeAudio } from '../services/voiceService.js';

// Logic for handling the voice chat/search requests
// The audio file arrives via multer middleware (req.file) as a Buffer in memory
export const handleVoiceSearch = async (req, res) => {
    // Create an AbortController tied to this request
    const abortController = new AbortController();

    // If the client disconnects (closes tab/window), abort all ongoing work
    req.on('close', () => {
        abortController.abort();
    });

    try {
        // Validate that an audio file was actually uploaded
        if (!req.file) {
            return res.status(400).json({
                error: 'No audio file provided',
                message: 'Please send an audio file in the "audio" form field'
            });
        }

        console.log(`Received audio file: ${req.file.originalname}, size: ${req.file.size} bytes, type: ${req.file.mimetype}`);

        // Send the audio buffer to Hugging Face Whisper for transcription
        const result = await transcribeAudio(req.file.buffer);

        // Guard: don't send a response if the client already disconnected
        if (abortController.signal.aborted) return;

        // Return the transcribed text to the frontend
        // The frontend will display this in the search bar and show a popup
        // for the user to pick options (depth, language, etc.) before calling /generate
        res.status(200).json({ text: result.text });
    } catch (error) {
        // If the error is because the client disconnected, just log and exit
        if (error.name === 'AbortError') {
            console.log('Voice search request aborted by client');
            return;
        }
        console.error('Error in voice search:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Failed to transcribe audio',
                message: error.message
            });
        }
    }
};
