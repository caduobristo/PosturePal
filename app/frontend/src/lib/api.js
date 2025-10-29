const API_BASE_URL =
  process.env.REACT_APP_API_URL?.replace(/\/$/, '') || 'http://localhost:8000/api';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const parseBody = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
};

const buildUrl = (path) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: {
      Accept: 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await parseBody(response);

  if (!response.ok) {
    const message =
      (data && (data.detail || data.message)) ||
      response.statusText ||
      'Request failed';
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export const login = (email, password) => {
  const body = new URLSearchParams({
    username: email,
    password,
  });

  return request('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
};

export const registerUser = (payload) =>
  request('/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

export const fetchUser = (userId) => request(`/users/${userId}`);

export const createSession = (payload) =>
  request('/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

export const fetchSessionsForUser = (userId) =>
  request(`/users/${userId}/sessions`);

export const fetchSession = (sessionId) => request(`/sessions/${sessionId}`);
