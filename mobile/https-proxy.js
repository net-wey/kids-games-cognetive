/**
 * Простой HTTPS прокси для Expo веб-приложения
 * Позволяет открывать приложение по HTTPS на телефоне
 * Использует только встроенные модули Node.js
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Порт для HTTPS прокси
const HTTPS_PORT = 8443;
// Порт Expo (обычно 8081)
const EXPO_PORT = 8081;

// Пути к сертификатам mkcert (проверяем несколько мест)
const certPaths = [
  // Стандартная папка mkcert на Windows
  {
    key: path.join(process.env.LOCALAPPDATA || '', 'mkcert', 'localhost+2-key.pem'),
    cert: path.join(process.env.LOCALAPPDATA || '', 'mkcert', 'localhost+2.pem')
  },
  // Альтернативная папка
  {
    key: path.join(process.env.USERPROFILE || process.env.HOME || '', '.mkcert', 'localhost+2-key.pem'),
    cert: path.join(process.env.USERPROFILE || process.env.HOME || '', '.mkcert', 'localhost+2.pem')
  },
  // Текущая директория (где был запущен mkcert)
  {
    key: path.join(__dirname, 'localhost+3-key.pem'),
    cert: path.join(__dirname, 'localhost+3.pem')
  },
  {
    key: path.join(__dirname, 'localhost+2-key.pem'),
    cert: path.join(__dirname, 'localhost+2.pem')
  },
  // Корневая директория проекта
  {
    key: path.join(__dirname, '..', 'localhost+3-key.pem'),
    cert: path.join(__dirname, '..', 'localhost+3.pem')
  },
  {
    key: path.join(__dirname, '..', 'localhost+2-key.pem'),
    cert: path.join(__dirname, '..', 'localhost+2.pem')
  }
];

let key, cert;
let foundCert = null;

// Пытаемся найти сертификаты
for (const certPath of certPaths) {
  if (fs.existsSync(certPath.key) && fs.existsSync(certPath.cert)) {
    key = fs.readFileSync(certPath.key);
    cert = fs.readFileSync(certPath.cert);
    foundCert = certPath.cert;
    console.log('✅ Найден сертификат mkcert:', certPath.cert);
    break;
  }
}

if (!foundCert) {
  console.warn('⚠️  Сертификаты mkcert не найдены!');
  console.warn('   Установите mkcert и выполните: mkcert -install');
  console.warn('   Затем создайте сертификат: mkcert localhost 192.168.0.114');
  console.warn('   Или используйте AR игры напрямую: https://192.168.0.114:3001');
  process.exit(1);
}

// Порт Backend API
const API_PORT = 5000;
// Порт AR сервера
const AR_PORT = 3001;

// Функция проксирования с поддержкой API и AR запросов
function proxyRequest(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  
  // Определяем, является ли запрос частью AR приложения
  const referer = req.headers.referer || req.headers.referrer || '';
  const isFromAR = referer.includes('/ar/') || referer.includes('/ar-games/') || referer.includes(':3001');
  
  // Проверяем, является ли это запросом к основному приложению (Expo/React Native)
  const isMainAppRequest = 
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_expo/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.match(/^\/node_modules\/expo/) ||
    url.pathname.match(/^\/node_modules\/react-native/) ||
    url.pathname.match(/^\/node_modules\/@react-native/) ||
    url.pathname.match(/^\/node_modules\/@expo/) ||
    url.pathname.match(/\.bundle(\?|$)/) || // Expo bundles
    url.pathname.includes('AppEntry.bundle');
  
  // Явные признаки AR/Vite запросов (независимо от Referer)
  // Если путь явно указывает на AR/Vite и это не основной app - это AR запрос
  const isExplicitARRequest = 
    url.pathname.startsWith('/ar/') || 
    url.pathname.startsWith('/ar-games/') ||
    url.pathname.startsWith('/node_modules/vite/') || // Vite клиент
    url.pathname.startsWith('/node_modules/.vite/') || // Vite зависимости
    (url.pathname.startsWith('/@') && !isMainAppRequest); // Vite HMR
  
  // Дополнительная проверка: запросы к /src/ всегда AR (если не основной app)
  // Это нужно, потому что Referer может не передаваться правильно в iframe
  const isSrcRequest = url.pathname.startsWith('/src/') && !isMainAppRequest;
  
  // Определяем AR запросы:
  // 1. Явные AR пути или Vite файлы
  // 2. Запросы к /src/ (если не основной app) - всегда AR
  // 3. Запросы с AR страницы, которые не являются запросами основного приложения
  const isARRequest = 
    isExplicitARRequest ||
    isSrcRequest || // Запросы к /src/ всегда AR (если не основной app)
    (isFromAR && !isMainAppRequest && (
      url.pathname.startsWith('/src/') || // Исходники AR приложения
      url.pathname.startsWith('/node_modules/') || // node_modules для AR (но не expo/react-native)
      url.pathname.startsWith('/assets/') || // Assets AR приложения
      url.pathname.match(/\.(js|jsx|ts|tsx|css|json|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|mjs)$/i) // Статические файлы
    ));
  
  // Если запрос к AR играм или Vite файлам - проксируем на AR сервер (HTTPS)
  if (isARRequest) {
    console.log(`🎮 AR Proxy: ${req.method} ${url.pathname}`);
    if (referer) {
      console.log(`   Referer: ${referer.substring(0, 80)}`);
    }
    console.log(`   isFromAR: ${isFromAR}, isMainAppRequest: ${isMainAppRequest}`);
    
    // Убираем префикс /ar/ или /ar-games/ из пути, если есть
    let arPath = url.pathname;
    if (arPath.startsWith('/ar/') || arPath.startsWith('/ar-games/')) {
      arPath = arPath.replace(/^\/ar(-games)?\//, '/');
    }
    // Если путь пустой или корневой - возвращаем index.html
    if (arPath === '/' || arPath === '') {
      arPath = '/index.html';
    }
    const arUrl = arPath + url.search;
    
    console.log(`   → Proxying to AR server: ${arUrl}`);
    
    const arOptions = {
      hostname: 'localhost',
      port: AR_PORT,
      path: arUrl,
      method: req.method,
      headers: {
        ...req.headers,
        host: `localhost:${AR_PORT}`
      },
      // Используем HTTPS для AR сервера
      protocol: 'https:',
      rejectUnauthorized: false // Разрешаем самоподписанные сертификаты
    };

    // Используем https модуль для проксирования на HTTPS AR сервер
    const arReq = https.request(arOptions, (arRes) => {
      // Добавляем CORS заголовки для AR
      const headers = {
        ...arRes.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      };
      res.writeHead(arRes.statusCode, headers);
      arRes.pipe(res);
    });

    // Таймаут для AR запросов (10 секунд)
    arReq.setTimeout(10000, () => {
      console.error(`⏱️  AR Proxy timeout for ${url.pathname}`);
      arReq.destroy();
      if (!res.headersSent) {
        res.writeHead(504, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'AR Proxy timeout' }));
      }
    });

    arReq.on('error', (err) => {
      console.error(`❌ AR Proxy error for ${url.pathname}:`, err.message);
      if (!res.headersSent) {
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'AR Proxy error: ' + err.message }));
      }
    });
    
    arReq.on('response', (arRes) => {
      console.log(`✅ AR Proxy: ${url.pathname} → ${arRes.statusCode}`);
    });

    // Таймаут для входящего запроса (15 секунд)
    req.setTimeout(15000, () => {
      console.error(`⏱️  Request timeout for ${url.pathname}`);
      arReq.destroy();
      if (!res.headersSent) {
        res.writeHead(504, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'Request timeout' }));
      }
    });

    req.pipe(arReq);
    return;
  }
  
  // Если запрос к API - проксируем на Backend
  if (url.pathname.startsWith('/api/')) {
    const apiOptions = {
      hostname: 'localhost',
      port: API_PORT,
      path: url.pathname + url.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: `localhost:${API_PORT}`
      }
    };

    const apiReq = http.request(apiOptions, (apiRes) => {
      // Добавляем CORS заголовки для API
      const headers = {
        ...apiRes.headers,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      };
      res.writeHead(apiRes.statusCode, headers);
      apiRes.pipe(res);
    });

    // Таймаут для API запросов (5 секунд)
    apiReq.setTimeout(5000, () => {
      console.error(`⏱️  API Proxy timeout for ${url.pathname}`);
      apiReq.destroy();
      if (!res.headersSent) {
        res.writeHead(504, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'API Proxy timeout' }));
      }
    });

    apiReq.on('error', (err) => {
      console.error('API Proxy error:', err);
      if (!res.headersSent) {
        res.writeHead(500, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'API Proxy error: ' + err.message }));
      }
    });

    // Таймаут для входящего запроса (10 секунд)
    req.setTimeout(10000, () => {
      console.error(`⏱️  Request timeout for ${url.pathname}`);
      apiReq.destroy();
      if (!res.headersSent) {
        res.writeHead(504, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: 'Request timeout' }));
      }
    });

    req.pipe(apiReq);
    return;
  }

  // Обычные запросы проксируем на Expo
  const options = {
    hostname: 'localhost',
    port: EXPO_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${EXPO_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  // Таймаут для Expo запросов (10 секунд)
  proxyReq.setTimeout(10000, () => {
    console.error(`⏱️  Expo Proxy timeout for ${req.url}`);
    proxyReq.destroy();
    if (!res.headersSent) {
      res.writeHead(504);
      res.end('Proxy timeout');
    }
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Proxy error: ' + err.message);
    }
  });

  // Таймаут для входящего запроса (15 секунд)
  req.setTimeout(15000, () => {
    console.error(`⏱️  Request timeout for ${req.url}`);
    proxyReq.destroy();
    if (!res.headersSent) {
      res.writeHead(504);
      res.end('Request timeout');
    }
  });

  req.pipe(proxyReq);
}

// Создаем HTTPS сервер
const server = https.createServer({ key, cert }, proxyRequest);

// WebSocket upgrade для hot reload
server.on('upgrade', (req, socket, head) => {
  const proxySocket = http.request({
    hostname: 'localhost',
    port: EXPO_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers
  });

  proxySocket.on('upgrade', (res, proxySocket, proxyHead) => {
    socket.write('HTTP/1.1 101 Switching Protocols\r\n');
    socket.write(Object.keys(res.headers).map(key => `${key}: ${res.headers[key]}\r\n`).join(''));
    socket.write('\r\n');
    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxySocket.end();
});

server.listen(HTTPS_PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔒 HTTPS Прокси запущен!');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\n📱 Откройте на телефоне:`);
  console.log(`   https://192.168.0.114:${HTTPS_PORT}`);
  console.log(`\n💻 Или на компьютере:`);
  console.log(`   https://localhost:${HTTPS_PORT}`);
  console.log(`\n✅ Проксирует запросы:`);
  console.log(`   - Основное приложение → Expo (http://localhost:${EXPO_PORT})`);
  console.log(`   - API запросы (/api/*) → Backend (http://localhost:${API_PORT})`);
  console.log(`   - AR игры (/ar/*) → AR сервер (https://localhost:${AR_PORT})`);
  console.log('═══════════════════════════════════════════════════════\n');
});

