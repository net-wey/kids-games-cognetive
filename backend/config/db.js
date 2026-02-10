const { Sequelize } = require('sequelize');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    timestamps: true,
    underscored: false
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite подключена успешно');
    console.log(`📁 База данных: ${dbPath}`);
    
    // Загрузка моделей и ассоциаций
    require('../models');
    console.log('✅ Модели и ассоциации загружены');
    
    // Синхронизация моделей с БД
    // Используем alter: false для предотвращения конфликтов с существующими данными
    // Или force: true для пересоздания таблиц (удалит все данные!)
    const syncOptions = {
      alter: false, // Изменено с true на false
      force: false  // Установите true только если хотите удалить все данные
    };
    
    await sequelize.sync(syncOptions);
    console.log('✅ Модели синхронизированы с БД');
  } catch (error) {
    console.error('❌ Ошибка подключения к SQLite:', error.message);
    console.error('Stack:', error.stack);
    throw error; // Бросаем ошибку вместо process.exit для лучшей диагностики
  }
};

module.exports = { sequelize, connectDB };










