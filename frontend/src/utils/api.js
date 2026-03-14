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

// Specific API methods
export const api = {
  get: (endpoint) => apiCall(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiCall(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => apiCall(endpoint, { method: 'PUT', body }),
  delete: (endpoint) => apiCall(endpoint, { method: 'DELETE' }),
  patch: (endpoint, body) => apiCall(endpoint, { method: 'PATCH', body }),
};
