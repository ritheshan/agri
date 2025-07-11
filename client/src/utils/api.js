import axios from 'axios';

// Create an instance of axios with a base URL
const api = axios.create({
  baseURL: 'http://localhost:8000',
});

// Function to set the auth token for all subsequent requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Create a helper function to make authenticated requests
export const makeAuthRequest = (token) => {
  // Create a new instance with the token
  const authApi = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return authApi;
};

export default api;
