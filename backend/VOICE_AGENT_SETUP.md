# Voice Agent Setup (Voice Input to Text)

This document captures the process used to add backend voice-input support using Hugging Face Whisper.

## Goal

Accept an authenticated audio upload from the frontend and return transcribed text.

## 1) Install backend dependencies

Run in `backend/`:

```bash
npm install @huggingface/inference multer
```

What these are used for:
- `multer`: parses `multipart/form-data` and exposes uploaded audio as `req.file`.
- `@huggingface/inference`: sends the audio buffer to Whisper for ASR transcription.

## 2) Create upload middleware

File: `backend/middlewares/upload.js`

Implemented:
- `multer.memoryStorage()` so audio is kept in memory as `req.file.buffer`.
- 10MB file limit.
- MIME validation for common browser/mobile audio formats.
- Base MIME matching (`audio/webm;codecs=opus` -> `audio/webm`) to avoid false rejections.

## 3) Create voice transcription service

File: `backend/services/voiceService.js`

Implemented:
- Initializes `InferenceClient` using `HF_ACCESS_TOKEN`.
- Calls `hf.automaticSpeechRecognition()` with model `openai/whisper-large-v3`.
- Returns `{ text }`.
- Handles common provider errors (401, 429, 503/loading) with user-friendly messages.

## 4) Connect controller logic

File: `backend/controllers/searchController.js`

Implemented in `handleVoiceSearch`:
- Validates `req.file` exists.
- Sends `req.file.buffer` to `transcribeAudio()`.
- Returns success payload:

```json
{
  "text": "...transcribed text...",
  "message": "Voice transcribed successfully"
}
```

## 5) Wire protected route

File: `backend/routes/search.js`

Voice route flow:
1. `checkJwt` verifies auth token.
2. `upload.single('audio')` parses the uploaded file.
3. `handleVoiceSearch` transcribes and responds.

Route:

```js
router.post('/voice', checkJwt, upload.single('audio'), handleVoiceSearch);
```

## 6) Improve global error handling for uploads

File: `backend/middlewares/errorHandler.js`

Added handling for:
- `MulterError` (`LIMIT_FILE_SIZE` -> `413 Payload Too Large`).
- Upload validation errors (`400 Bad Request`) from file filter.

This prevents bad uploads from returning generic `500` errors.

## 7) Environment setup

In `backend/.env`, set:

```env
HF_ACCESS_TOKEN=your_huggingface_token
```

Without this token, voice transcription fails with a clear error message.

## 8) Frontend request contract

Backend expects:
- `POST /api/search/voice`
- `Authorization: Bearer <token>`
- `multipart/form-data`
- audio file field name: `audio`

## 9) Quick manual test

Use Postman or curl:

```bash
curl -X POST http://localhost:5000/api/search/voice \
  -H "Authorization: Bearer <access_token>" \
  -F "audio=@recording.webm"
```

Expected result: `200` with JSON containing `text`.

## 10) Known operational notes

- First request can be slower if the model is warming up on Hugging Face.
- Very long audio should be chunked client-side for better latency and reliability.
- If browser records with codec parameters (for example `audio/webm;codecs=opus`), backend accepts it through base MIME normalization.
