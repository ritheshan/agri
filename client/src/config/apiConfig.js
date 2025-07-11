// API configuration for the AgriMaster application
// This file centralizes all API endpoint configurations

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const ENDPOINTS = {
  // Authentication
  LOGIN: `${API_URL}/auth/login`,
  REGISTER: `${API_URL}/auth/register`,
  PROFILE: `${API_URL}/auth/profile`,
  
  // Disease detection
  DETECT_DISEASE: `${API_URL}/detect_disease`,
  DETECT_DISEASE_ENVIRONMENTAL: `${API_URL}/detect_disease_environmental`,
  DISEASE_FEEDBACK: `${API_URL}/feedback/disease_detection`,
  
  // Crop management
  RECOMMEND_CROP: `${API_URL}/recommend_crop`,
  PREDICT_YIELD: `${API_URL}/predict_yield`,
  RECOMMEND_FERTILIZER: `${API_URL}/recommend_fertilizer`,
  PREDICT_STRESS: `${API_URL}/predict_stress`,
  
  // Weather and spray
  WEATHER_DATA: `${API_URL}/get_agri_data`,
  SPRAY_WINDOW: `${API_URL}/spray_window`,
  WEATHER_ALERTS: `${API_URL}/weather_alerts`,
  
  // Community
  POSTS: `${API_URL}/community/posts`,
  POST_LIKE: (postId) => `${API_URL}/community/posts/${postId}/like`,
  POST_COMMENTS: (postId) => `${API_URL}/community/posts/${postId}/comments`,
  DELETE_COMMENT: (postId, commentIndex) => `${API_URL}/community/posts/${postId}/comments/${commentIndex}`,
};

export default API_URL;
