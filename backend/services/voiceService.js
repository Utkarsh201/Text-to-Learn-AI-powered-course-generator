import { InferenceClient } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config();


// in this file following things are done 
// 1. hugging face model is initialized
// 2. transcribeAudio, takes the raw audio from the audio sitting inside the RAM that was prepared by the multer. 
// 3. it sends the raw audio to the hugging face model for transcription
// 4. error handling


const hfToken = process.env.HF_ACCESS_TOKEN;
const hf = hfToken ? new InferenceClient(hfToken) : null;
// inference client is used to interact with the hugging face model

// Model used for speech-to-text transcription.
const ASR_MODEL = 'openai/whisper-large-v3';

/**
 * Transcribe an audio buffer using Hugging Face automatic speech recognition.
 *
 * @param {Buffer} audioBuffer Raw audio data (webm, wav, flac, mp3, ogg, mp4)
 * @returns {Promise<{ text: string }>} Transcribed text
 */
  // it is a standard way of documenting what a js function does 
  // argument is audiobuffer and the data type is Buffer
  // return type is a promise that resolves to an object with a text property

  // buffer is the special type of data that is used to handle raw, binary data

export const transcribeAudio = async (audioBuffer) => {
  if (!hf) {
    throw new Error('HF_ACCESS_TOKEN is missing. Add it to backend/.env before using voice transcription.');
  }

  try {
    const result = await hf.automaticSpeechRecognition({
      model: ASR_MODEL,
      data: audioBuffer,
    });

    const text = typeof result?.text === 'string' ? result.text : '';
    if (!text.trim()) {
      throw new Error('Transcription completed but no text was returned.');
    }

    if (process.env.NODE_ENV !== 'production' && process.env.DEBUG_VOICE_TRANSCRIPTION === 'true') {
      console.log(`Transcription successful. Transcript length: ${text.length} characters.`);
    }
    return { text };
  } catch (error) {
    console.error('Hugging Face transcription error:', error.message);

    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      throw new Error('Invalid Hugging Face API token. Check HF_ACCESS_TOKEN in backend/.env.');
    }

    if (error.message?.includes('503') || error.message?.toLowerCase().includes('loading')) {
      throw new Error('The Whisper model is loading on Hugging Face. Please retry in about 20 seconds.');
    }

    if (error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit')) {
      throw new Error('Hugging Face rate limit reached. Please wait and retry.');
    }

    throw error;
  }
};
