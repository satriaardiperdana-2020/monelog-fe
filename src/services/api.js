// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor – automatically add JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Do not redirect on logout endpoint (to avoid intercepting the logout call itself)
    const isLogoutRequest = error.config?.url?.includes('/auth/logout');

    if (error.response?.status === 401 && !isLogoutRequest) {
      // Token expired or invalid – clear local storage and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;