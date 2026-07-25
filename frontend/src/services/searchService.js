import { uploadForm } from "./apiClient";

export const transcribeAudio = ({ token, audioBlob, fileName = "recording.webm" }) => {
  const formData = new FormData();
  formData.append("audio", audioBlob, fileName);

  return uploadForm("/api/search/voice", formData, token);
};
