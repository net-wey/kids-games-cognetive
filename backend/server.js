require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/games', require('./routes/games'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/admin', require('./routes/admin'));

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({ 
    message: 'Cognitive Kids API',
    version: '1.0.0',
    status: 'running',
    database: 'SQLite'
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Cognitive Kids API',
    version: '1.0.0',
    endpoints: ['/api/auth', '/api/games', '/api/friends', '/api/admin']
  });
});

// Обработчик ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Что-то пошло не так!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

// Запуск сервера после подключения к БД
const startServer = async () => {
  try {
    // Подключение к БД
    await connectDB();
    
    // Запуск сервера
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📍 API доступен по адресу:`);
      console.log(`   - http://localhost:${PORT}`);
      console.log(`   - http://192.168.0.114:${PORT}`);
      console.log(`💾 База данных: SQLite`);
      console.log(`🌍 Окружение: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Не удалось запустить сервер:', error);
    process.exit(1);
  }
};

startServer();
