import axios from 'axios';

const defaultBaseUrl = import.meta?.env?.DEV
  ? 'http://localhost:5000/api/v1'
  : 'https://edu-hub-backend-blond.vercel.app/api/v1';

// Create a configured axios instance pointing to the local dev or hosted backend
const axiosInstance = axios.create({
  baseURL: import.meta?.env?.VITE_API_URL || defaultBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('eduHubToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('eduHubToken');
      }
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
