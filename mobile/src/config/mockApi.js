import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEMO_TOKEN = 'demo-admin-token';

export const demoAdminUser = {
  id: 1,
  username: 'admin',
  role: 'admin',
  isActive: true,
  childName: '',
  age: null,
  children: [],
  friends: [],
};

const demoUsers = [
  demoAdminUser,
  {
    id: 2,
    username: 'parent_demo',
    role: 'parent',
    isActive: true,
    children: [
      { id: 4, username: 'misha_demo', childName: 'Миша', age: 5, isActive: true },
      { id: 5, username: 'anya_demo', childName: 'Аня', age: 4, isActive: true },
    ],
  },
  {
    id: 3,
    username: 'parent_test',
    role: 'parent',
    isActive: true,
    children: [
      { id: 6, username: 'sonya_demo', childName: 'Соня', age: 6, isActive: true },
    ],
  },
];

const demoStatistics = {
  users: {
    total: 6,
    parents: 2,
    children: 3,
    active: 6,
  },
  games: {
    total: 128,
    lastWeek: 34,
  },
  popularGames: [
    { gameType: 'memory', count: 31 },
    { gameType: 'counting', count: 26 },
    { gameType: 'sorting', count: 21 },
    { gameType: 'ar-adventure', count: 18 },
    { gameType: 'odd-one-out', count: 16 },
  ],
};

const normalizePath = (url = '') => {
  if (url.startsWith('http')) {
    try {
      return new URL(url).pathname.replace(/^\/api/, '') || '/';
    } catch (error) {
      return url;
    }
  }

  return url.replace(/^\/api/, '') || '/';
};

const getStoredDemoToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    return null;
  }
};

export const getMockResponse = async ({ method = 'get', url = '', data = {} }) => {
  const path = normalizePath(url);
  const normalizedMethod = method.toLowerCase();

  if (normalizedMethod === 'post' && path === '/auth/login') {
    if (data?.username === 'admin' && data?.password === 'admin') {
      return {
        success: true,
        token: DEMO_TOKEN,
        user: demoAdminUser,
      };
    }

    return null;
  }

  const token = await getStoredDemoToken();
  if (token !== DEMO_TOKEN) {
    return null;
  }

  if (normalizedMethod === 'get' && path === '/auth/me') {
    return {
      success: true,
      user: demoAdminUser,
    };
  }

  if (normalizedMethod === 'get' && path === '/admin/statistics') {
    return {
      success: true,
      statistics: demoStatistics,
    };
  }

  if (normalizedMethod === 'get' && path === '/admin/users') {
    return {
      success: true,
      count: demoUsers.length,
      users: demoUsers,
    };
  }

  if (normalizedMethod === 'post' && path === '/auth/register-parent') {
    const parent = {
      id: Date.now(),
      username: data.username,
      role: 'parent',
      credentials: {
        username: data.username,
        password: data.password,
      },
    };

    return {
      success: true,
      message: 'Родитель создан в демо-режиме',
      parent,
    };
  }

  if (normalizedMethod === 'put' && /^\/admin\/users\/\d+\/(activate|deactivate)$/.test(path)) {
    return {
      success: true,
      message: 'Статус пользователя обновлен в демо-режиме',
    };
  }

  if (normalizedMethod === 'delete' && /^\/admin\/users\/\d+$/.test(path)) {
    return {
      success: true,
      message: 'Пользователь удален в демо-режиме',
    };
  }

  return null;
};
