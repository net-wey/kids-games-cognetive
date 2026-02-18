require('dotenv').config();
const { sequelize, connectDB } = require('../config/db');
const { User } = require('../models');

const createAdmin = async () => {
  try {
    await connectDB();

    // Проверить существование админа
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    
    if (existingAdmin) {
      console.log('⚠️  Администратор уже существует');
      console.log('Username:', existingAdmin.username);
      process.exit(0);
    }

    // Создать администратора
    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    });

    console.log('✅ Администратор создан успешно!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  ОБЯЗАТЕЛЬНО смените пароль после первого входа!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
};

createAdmin();
