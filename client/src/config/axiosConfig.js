import axios from 'axios';
import API_URL from './apiConfig';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000, // Increased timeout for production environment
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
  async config => {
    const token = localStorage.getItem('agri_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return config;
  },
  error => {
    Promise.reject(error)
  }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    // Handle token expiration or authentication errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('agri_token');
      localStorage.removeItem('agri_user');
      
      // Redirect to login page if on a protected route
      const protectedRoutes = ['/dashboard', '/community', '/profile', '/profit-calculator'];
      const currentPath = window.location.pathname;
      
      if (protectedRoutes.includes(currentPath)) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
