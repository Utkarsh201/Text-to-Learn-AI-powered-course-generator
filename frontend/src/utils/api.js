import { request, uploadForm } from "../services/apiClient";

export const apiCall = (endpoint, options = {}) => {
  return request(endpoint, options);
};

export const uploadFile = (endpoint, fieldName, fileBlob, fileName, token) => {
  const formData = new FormData();
  formData.append(fieldName, fileBlob, fileName);
  return uploadForm(endpoint, formData, token);
};

export const api = {
  get: (endpoint, token) => request(endpoint, { token }),
  post: (endpoint, body, token) => request(endpoint, { method: "POST", body, token }),
  put: (endpoint, body, token) => request(endpoint, { method: "PUT", body, token }),
  delete: (endpoint, token) => request(endpoint, { method: "DELETE", token }),
  patch: (endpoint, body, token) => request(endpoint, { method: "PATCH", body, token }),
  uploadAudio: (audioBlob, token) =>
    uploadFile("/api/search/voice", "audio", audioBlob, "recording.webm", token),
};
