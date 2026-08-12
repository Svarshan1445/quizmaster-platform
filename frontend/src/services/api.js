import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('quiz_token') || sessionStorage.getItem('quiz_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token expiry / unauth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (error.response.data && (error.response.data.message === 'Invalid or expired token' || error.response.data.message === 'Token required')) {
        localStorage.removeItem('quiz_token');
        localStorage.removeItem('quiz_user');
        sessionStorage.removeItem('quiz_token');
        sessionStorage.removeItem('quiz_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
