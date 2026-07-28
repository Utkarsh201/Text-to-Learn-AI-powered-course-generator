import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// in this file following things are done 
// 1. Gemini model is initialized
// 2. transcribeAudio, takes the raw audio from the audio sitting inside the RAM that was prepared by multer. 
// 3. it sends the raw audio to the Gemini model for transcription
// 4. error handling

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
// inference client is used to interact with the Gemini model

/**
 * Transcribe an audio buffer using Gemini 2.5 Flash model.
 *
 * @param {Buffer} audioBuffer Raw audio data (webm, wav, flac, mp3, ogg, mp4)
 * @param {string} mimeType The MIME type of the audio file (e.g. audio/webm)
 * @returns {Promise<{ text: string }>} Transcribed text
 */
export const transcribeAudio = async (audioBuffer, mimeType = 'audio/webm') => {
  if (!ai) {
    throw new Error('GEMINI_API_KEY is missing. Add it to backend/.env before using voice transcription.');
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: audioBuffer.toString("base64"),
            mimeType: mimeType,
          }
        },
        "Please transcribe this audio accurately. Output only the exact text transcription and nothing else. Do not add conversational fillers, markdown formatting, or introductory text."
      ],
      config: {
        temperature: 0.1,
      }
    });

    const text = typeof response?.text === 'string' ? response.text.trim() : '';
    if (!text) {
      throw new Error('Transcription completed but no text was returned.');
    }

    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_VOICE_TRANSCRIPTION === 'true') {
      console.log(`Transcription successful. Transcript length: ${text.length} characters.`);
    }
    
    return { text };
  } catch (error) {
    console.error('Gemini transcription error:', error.message);
    throw new Error('Failed to transcribe audio using Gemini. Please try again.');
  }
};
