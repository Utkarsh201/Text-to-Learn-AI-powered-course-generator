const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Generic API request function
export const apiCall = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body = null,
  } = options;

  try {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

/**
 * Upload a file (e.g. audio) via multipart/form-data
 * Unlike apiCall, this does NOT set Content-Type — the browser auto-sets it with the correct boundary
 *
 * @param {string} endpoint - API endpoint path (e.g. '/api/search/voice')
 * @param {string} fieldName - The form field name expected by the backend (e.g. 'audio')
 * @param {Blob} fileBlob - The file data as a Blob
 * @param {string} fileName - The filename to send (e.g. 'recording.webm')
 * @param {string} token - Auth0 Bearer token for authentication
 * @returns {Promise<object>} - Parsed JSON response
 */
export const uploadFile = async (endpoint, fieldName, fileBlob, fileName, token) => {
  const formData = new FormData();
  formData.append(fieldName, fileBlob, fileName);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        // Only set Authorization — do NOT set Content-Type
        // The browser automatically sets it to multipart/form-data with the correct boundary
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Upload Error [${endpoint}]:`, error);
    throw error;
  }
};

// Specific API methods
export const api = {
  get: (endpoint) => apiCall(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiCall(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => apiCall(endpoint, { method: 'PUT', body }),
  delete: (endpoint) => apiCall(endpoint, { method: 'DELETE' }),
  patch: (endpoint, body) => apiCall(endpoint, { method: 'PATCH', body }),

  /**
   * Upload audio for voice-to-text transcription
   * @param {Blob} audioBlob - Audio blob from MediaRecorder
   * @param {string} token - Auth0 access token
   * @returns {Promise<{ text: string, message: string }>}
   */
  uploadAudio: (audioBlob, token) =>
    uploadFile('/api/search/voice', 'audio', audioBlob, 'recording.webm', token),
};
