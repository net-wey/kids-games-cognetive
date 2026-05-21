import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAPIUrl } from '../utils/network';
import { getMockResponse } from './mockApi';

// URL API автоматически определяется в зависимости от платформы
// Для веб-версии: localhost
// Для мобильных: IP компьютера или 10.0.2.2 для эмулятора
const API_URL = getAPIUrl();

// Логирование для отладки
console.log('🔧 API URL настроен:', API_URL);
console.log('🌐 Platform:', typeof window !== 'undefined' ? window.location.hostname : 'unknown');

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена к запросам
client.interceptors.request.use(
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
client.interceptors.response.use(
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

const createMockAxiosResponse = (data, config) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
});

const requestWithMockFallback = async (method, url, data, config = {}) => {
  const mockData = await getMockResponse({ method, url, data });

  if (mockData) {
    return createMockAxiosResponse(mockData, { ...config, method, url, data });
  }

  if (method === 'get' || method === 'delete') {
    return client[method](url, config);
  }

  return client[method](url, data, config);
};

const api = {
  get: (url, config) => requestWithMockFallback('get', url, undefined, config),
  post: (url, data, config) => requestWithMockFallback('post', url, data, config),
  put: (url, data, config) => requestWithMockFallback('put', url, data, config),
  delete: (url, config) => requestWithMockFallback('delete', url, undefined, config),
  interceptors: client.interceptors,
};

export default api;
