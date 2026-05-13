import { Platform } from 'react-native';

/**
 * Утилита для определения URL серверов в зависимости от платформы
 */

// Получаем IP адрес компьютера из переменной окружения или используем localhost
const getComputerIP = () => {
  // Проверяем переменную окружения (приоритет)
  const envIP = process.env.EXPO_PUBLIC_COMPUTER_IP;
  if (envIP) {
    return envIP;
  }
  
  // Для веб-версии проверяем, открыта ли страница по localhost или по IP
  if (Platform.OS === 'web') {
    // Если открыто по localhost на компьютере - используем localhost
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'localhost';
    }
    // Если открыто по IP (с телефона) - используем IP компьютера
    // IP адрес компьютера в локальной сети
    return '192.168.0.114';
  }
  
  // Для Android эмулятора
  if (Platform.OS === 'android') {
    // В эмуляторе используем 10.0.2.2, на реальном устройстве - IP компьютера
    return __DEV__ ? '10.0.2.2' : '192.168.0.114';
  }
  
  // Для iOS и других платформ - используем IP компьютера
  return '192.168.0.114';
};

/**
 * Получить URL для Backend API
 * Если страница загружена по HTTPS, используем относительный путь
 * чтобы избежать Mixed Content ошибок
 */
export const getAPIUrl = () => {
  // Для веб-версии проверяем протокол страницы
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Если страница загружена по HTTPS - используем относительный путь
    // Прокси будет перенаправлять запросы на backend
    if (window.location.protocol === 'https:') {
      return '/api';
    }
  }
  
  // Для мобильных платформ и HTTP - используем полный URL
  const ip = getComputerIP();
  return `http://${ip}:5000/api`;
};

/**
 * Получить URL для AR сервера
 * Если страница загружена по HTTPS, используем относительный путь через прокси
 * чтобы избежать Mixed Content ошибок и необходимости принимать сертификат отдельно
 */
export const getARServerUrl = () => {
  // Для веб-версии проверяем протокол страницы
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Если страница загружена по HTTPS - используем относительный путь через прокси
    // Прокси будет перенаправлять запросы на AR сервер
    if (window.location.protocol === 'https:') {
      return '/ar/';
    }
  }
  
  // Для мобильных платформ и HTTP - используем полный URL
  const ip = getComputerIP();
  return `https://${ip}:3001`;
};

/**
 * Получить IP адрес компьютера для отображения пользователю
 * Используется для инструкций по подключению
 */
export const getNetworkIP = () => {
  if (Platform.OS === 'web') {
    return 'localhost';
  }
  
  // В продакшене можно использовать переменную окружения
  // EXPO_PUBLIC_COMPUTER_IP=192.168.1.100
  const envIP = process.env.EXPO_PUBLIC_COMPUTER_IP;
  if (envIP) {
    return envIP;
  }
  
  // По умолчанию для разработки
  return '192.168.0.114'; // IP адрес компьютера
};

