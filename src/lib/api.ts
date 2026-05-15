import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true,
});

// Add a request interceptor to attach the session token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('technova_session_token');
  if (token) {
    config.headers['x-session-id'] = token;
  }
  return config;
});

export default api;
