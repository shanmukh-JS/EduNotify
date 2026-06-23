const BASE_URL = 'http://localhost:5000/api';

/**
 * Custom request wrapper for API calls.
 * Automatically injects authorization JWT token if present.
 */
const request = async (method, path, body = null, isPublic = false) => {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json'
  };

  if (!isPublic) {
    const token = localStorage.getItem('edunotify_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    let errorMsg = 'An error occurred while communicating with the server.';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorMsg;
    } catch (_) {
      // fallback if not JSON response
    }
    throw new Error(errorMsg);
  }

  return response.json();
};

export const api = {
  get: (path, isPublic = false) => request('GET', path, null, isPublic),
  post: (path, body, isPublic = false) => request('POST', path, body, isPublic),
  put: (path, body, isPublic = false) => request('PUT', path, body, isPublic),
  delete: (path, isPublic = false) => request('DELETE', path, null, isPublic),
  
  setToken: (token) => localStorage.setItem('edunotify_token', token),
  getToken: () => localStorage.getItem('edunotify_token'),
  clearToken: () => localStorage.removeItem('edunotify_token'),
  
  setUser: (user) => localStorage.setItem('edunotify_user', JSON.stringify(user)),
  getUser: () => {
    const u = localStorage.getItem('edunotify_user');
    return u ? JSON.parse(u) : null;
  },
  clearUser: () => localStorage.removeItem('edunotify_user')
};
