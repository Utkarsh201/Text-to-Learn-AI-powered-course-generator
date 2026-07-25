import { useCallback, useRef, useState } from "react";
import { transcribeAudio } from "../services/searchService";

const getPreferredMimeType = () => {
  if (!window.MediaRecorder) return "";

  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return "audio/webm;codecs=opus";
  }

  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return "audio/webm";
  }

  if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return "audio/mp4";
  }

  return "";
};

export const useVoiceTranscription = ({ getToken, onTranscription }) => {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        throw new Error("Voice recording is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getPreferredMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const extension = mimeType.includes("mp4") ? "mp4" : "webm";
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        stopStream();
        setIsProcessing(true);

        try {
          const token = await getToken();
          const result = await transcribeAudio({
            token,
            audioBlob,
            fileName: `recording.${extension}`,
          });
          onTranscription?.(result.text || "");
        } catch (transcriptionError) {
          setError(transcriptionError.message || "Voice transcription failed.");
        } finally {
          setIsProcessing(false);
        }
      };

      recorder.start(250);
      setIsRecording(true);
    } catch (recordingError) {
      stopStream();
      setError(recordingError.message || "Could not start voice recording.");
    }
  }, [getToken, onTranscription, stopStream]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") {
      recorder.stop();
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }

    startRecording();
  }, [isRecording, startRecording, stopRecording]);

  return {
    error,
    isProcessing,
    isRecording,
    toggleRecording,
  };
};
