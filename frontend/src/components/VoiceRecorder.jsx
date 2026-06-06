import { useState, useRef, useCallback } from 'react';
import { uploadFile } from '../utils/api';

/**
 * VoiceRecorder Component
 *
 * Records audio from the user's microphone using the browser's MediaRecorder API,
 * sends it to the backend for transcription via Hugging Face Whisper, and returns the text.
 *
 * Props:
 *   - onTranscription(text: string) — called with the transcribed text when transcription completes
 *   - onError(error: Error)         — called when an error occurs (optional)
 *   - getToken()                    — async function that returns the Auth0 access token
 *                                     e.g. from useAuth0().getAccessTokenSilently
 *
 * Usage:
 *   <VoiceRecorder
 *     getToken={getAccessTokenSilently}
 *     onTranscription={(text) => console.log('Transcribed:', text)}
 *     onError={(err) => console.error(err)}
 *   />
 */
const VoiceRecorder = ({ onTranscription, onError, getToken }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Refs persist across re-renders without causing them
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);

    try {
      // Request microphone access from the browser
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine the best supported MIME type for recording
      // Chrome/Firefox default to audio/webm, Safari may use audio/mp4
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : ''; // If nothing matches, leave it blank so the browser picks its default

      // Only pass the mimeType option if we successfully found a supported one
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio data chunks as they become available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // When recording stops, assemble the chunks and send to backend
      mediaRecorder.onstop = async () => {
        // Get the actual MIME type the browser decided to use
        const actualMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm';

        // Combine all chunks into a single Blob
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });

        // Stop all microphone tracks to release the mic
        stream.getTracks().forEach((track) => track.stop());

        // Determine file extension from the actual MIME type
        const extension = actualMimeType.includes('mp4') ? 'mp4' : 'webm';

        setIsProcessing(true);
        try {
          // Get the Auth0 access token for authenticated API call
          const token = await getToken();

          // Send the audio to the backend for transcription
          const result = await uploadFile(
            '/api/search/voice',
            'audio',
            audioBlob,
            `recording.${extension}`,
            token
          );

          // Pass the transcribed text back to the parent component
          if (onTranscription) {
            onTranscription(result.text);
          }
        } catch (err) {
          console.error('Transcription failed:', err);
          const message = err.message || 'Failed to transcribe audio. Please try again.';
          setErrorMessage(message);
          if (onError) {
            onError(err);
          }
        } finally {
          setIsProcessing(false);
        }
      };

      // Start recording — timeslice of 250ms ensures ondataavailable fires regularly
      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);

      // Provide user-friendly error messages
      if (err.name === 'NotAllowedError') {
        setErrorMessage('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setErrorMessage('No microphone found. Please connect a microphone and try again.');
      } else {
        setErrorMessage('Could not access microphone. Please check your device settings.');
      }

      if (onError) {
        onError(err);
      }
    }
  }, [getToken, onTranscription, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Styles for the component
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
    },
    button: {
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: '600',
      border: 'none',
      borderRadius: '8px',
      cursor: isProcessing ? 'wait' : 'pointer',
      transition: 'all 0.2s ease',
      color: '#fff',
      backgroundColor: isProcessing
        ? '#6b7280'       // gray while processing
        : isRecording
          ? '#ef4444'     // red while recording
          : '#3b82f6',    // blue default
      opacity: isProcessing ? 0.7 : 1,
    },
    error: {
      color: '#ef4444',
      fontSize: '14px',
      maxWidth: '300px',
      textAlign: 'center',
    },
    status: {
      fontSize: '14px',
      color: '#6b7280',
    },
  };

  return (
    <div style={styles.container}>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        style={styles.button}
        aria-label={
          isProcessing
            ? 'Transcribing audio'
            : isRecording
              ? 'Stop recording'
              : 'Start recording'
        }
      >
        {isProcessing
          ? 'Transcribing...'
          : isRecording
            ? 'Stop Recording'
            : 'Record Voice'}
      </button>

      {isRecording && (
        <span style={styles.status}>Recording... Speak now</span>
      )}

      {isProcessing && (
        <span style={styles.status}>Sending audio to Whisper for transcription...</span>
      )}

      {errorMessage && (
        <p style={styles.error}>{errorMessage}</p>
      )}
    </div>
  );
};

export default VoiceRecorder;
