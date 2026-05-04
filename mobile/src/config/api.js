import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAPIUrl } from '../utils/network';

// URL API автоматически определяется в зависимости от платформы
// Для веб-версии: localhost
// Для мобильных: IP компьютера или 10.0.2.2 для эмулятора
const API_URL = getAPIUrl();

// Логирование для отладки
console.log('🔧 API URL настроен:', API_URL);
console.log('🌐 Platform:', typeof window !== 'undefined' ? window.location.hostname : 'unknown');

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена к запросам
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.log('API Error:', error.message);
    console.log('API URL:', API_URL);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    } else if (error.request) {
      console.log('No response received. Check if backend is running at:', API_URL);
    }
    
    if (error.response?.status === 401) {
      // Токен истек, удалить его
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;

