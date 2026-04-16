import multer from 'multer';

// this middle ware is being used in the search.js /voice route

// where 

// Use memory storage so the file is stored as a Buffer in req.file.buffer.
// This avoids writing temp files to disk; the buffer is sent directly to Hugging Face.
const storage = multer.memoryStorage();
// it simply means Multer is instructing your physical computer(or your server) to use its own RAM(Random Access Memory).


// Allowed base audio MIME types that Whisper can process.
// We compare against the base type (before ';'), so values like
// "audio/webm;codecs=opus" are accepted.
const ALLOWED_AUDIO_TYPES = new Set([
  'audio/webm',       // Chrome/Firefox MediaRecorder default
  'audio/wav',        // Standard uncompressed audio
  'audio/wave',       // Alternative WAV MIME type
  'audio/x-wav',      // Alternative WAV MIME type
  'audio/flac',       // Lossless compressed audio
  'audio/mpeg',       // MP3 files
  'audio/mp3',        // Alternative MP3 MIME type
  'audio/mp4',        // M4A / AAC audio
  'audio/x-m4a',      // Alternative M4A MIME type
  'audio/ogg',        // Ogg Vorbis/Opus
  'audio/opus',       // Opus audio
]);


// what is mime type ?
// A MIME type (also known as a media type) is a standard way of describing the nature and format of a piece of data.

// what is base mime type ?
// The "base" MIME type is the fundamental type of the file, ignoring any additional parameters or codecs.
// some browser are extra specific about the mime type so we are using base mime type, this means attaching a details onto the end sending it to the server
// in the below example the whole thing is the mime type and the audio/webm is the base mime type
// example -> audio/webm;codecs=opus -> audio/webm -> is the base mime type
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max;
  },
  fileFilter: (req, file, cb) => {
    // here cb is the callback function
    const mimeType = (file.mimetype || '').toLowerCase();
    const baseMimeType = mimeType.split(';')[0].trim();

    if (ALLOWED_AUDIO_TYPES.has(baseMimeType)) {
      // if everthing is right call nothing and true
      cb(null, true);
      return;
    }

    const error = new Error(
      `Unsupported audio format: ${file.mimetype}. Allowed base types: ${Array.from(ALLOWED_AUDIO_TYPES).join(', ')}`
    );
    error.status = 400;
    cb(error, false);
  },
});

export default upload;
