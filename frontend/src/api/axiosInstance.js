import axios from 'axios';

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10.") ||
    window.location.hostname.endsWith(".local") ||
    window.location.port === "5173" ||
    window.location.port === "3000");

const defaultBaseUrl = isLocalhost
  ? "http://localhost:5000/api/v1"
  : "https://edu-hub-backend-blond.vercel.app/api/v1";

// Create a configured axios instance pointing to the local dev or hosted backend
const axiosInstance = axios.create({
  baseURL: import.meta?.env?.VITE_API_URL || defaultBaseUrl,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Token & Active Campus Context
axiosInstance.interceptors.request.use(
  (config) => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('eduHubToken') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      const activeCampusId = typeof localStorage !== 'undefined' ? localStorage.getItem('eduHubActiveCampusId') : null;
      if (activeCampusId && !config.headers['x-campus-id']) {
        config.headers['x-campus-id'] = activeCampusId;
      }
    }
    // Enforce no-cache on all outbound API requests to avoid stale HTTP proxy/edge responses
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRedirecting = false;

// Response Interceptor: Handle 401 Unauthorized globally
axiosInstance.interceptors.response.use(
  (response) => {
    isRedirecting = false;
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/signup') ||
        requestUrl.includes('/auth/register');

      const isAuthPage =
        typeof window !== 'undefined' &&
        (window.location.pathname === '/login' ||
          window.location.pathname === '/signup' ||
          window.location.pathname === '/set-password');

      // Clear token and stale session cache on unauthorized response
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('eduHubToken');
        localStorage.removeItem('eduHubUser');
        localStorage.removeItem('eduHubActiveCampusId');
        localStorage.removeItem('eduHub_institutes_cache');
        localStorage.removeItem('eduHub_stats_cache');
      }

      // Avoid looping redirects if this was an auth endpoint or already on an auth page or already redirecting
      if (!isAuthEndpoint && !isAuthPage && !isRedirecting && typeof window !== 'undefined') {
        isRedirecting = true;
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
