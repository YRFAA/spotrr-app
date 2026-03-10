import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
const API_URL = "https://spotrr-api-production.up.railway.app";
// Production backend URL - fallback to ensure it works in builds
const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl !== 'undefined') {
    return envUrl + '/api';
  }
  // Fallback for production builds
  return 'https://spotrr.emergent.app/api';
};

const API_URL = "https://spotrr-api-production.up.railway.app";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      await AsyncStorage.removeItem('auth_token');
    }
    return Promise.reject(error);
  }
);

export default api;
