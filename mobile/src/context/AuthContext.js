import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../config/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        // Сначала устанавливаем данные из кэша
        setUser(JSON.parse(userData));
        
        // Затем обновляем данные с сервера
        try {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
            setUser(response.data.user);
          }
        } catch (error) {
          console.log('Не удалось обновить данные с сервера:', error.message);
          // Оставляем закэшированные данные если сервер недоступен
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки пользователя:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      if (response.data.success) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Ошибка входа' 
      };
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Ошибка выхода:', error);
    }
  };

  const updateUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.success) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

