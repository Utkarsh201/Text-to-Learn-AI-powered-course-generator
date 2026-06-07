export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const parseResponse = async (response) => {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message || payload?.error || `HTTP Error: ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload;
};

export const request = async (endpoint, { method = "GET", token, body, headers = {} } = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  return parseResponse(response);
};

export const uploadForm = async (endpoint, formData, token) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  return parseResponse(response);
};
