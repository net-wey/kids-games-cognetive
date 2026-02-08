const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Генерация JWT токена
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Логин пользователя
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Пожалуйста, укажите имя пользователя и пароль' 
      });
    }

    const user = await User.findOne({ 
      where: { username },
      include: [
        {
          model: User,
          as: 'children',
          attributes: ['id', 'username', 'childName', 'age', 'isActive'],
          required: false
        },
        {
          model: User,
          as: 'parent',
          attributes: ['id', 'username'],
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Неверный пароль' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Аккаунт деактивирован' });
    }

    const token = generateToken(user.id);

    // Формируем ответ с данными пользователя
    const userResponse = {
      id: user.id,
      username: user.username,
      role: user.role,
      childName: user.childName,
      age: user.age,
      parentId: user.parentId,
      isActive: user.isActive
    };

    // Добавляем детей для родителя
    if (user.role === 'parent' && user.children) {
      userResponse.children = user.children.map(child => ({
        id: child.id,
        username: child.username,
        childName: child.childName,
        age: child.age,
        isActive: child.isActive
      }));
    }

    // Добавляем информацию о родителе для ребенка
    if (user.role === 'child' && user.parent) {
      userResponse.parent = {
        id: user.parent.id,
        username: user.parent.username
      };
    }

    res.json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Ошибка при логине:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Получить текущего пользователя
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: User,
          as: 'children',
          attributes: ['id', 'username', 'childName', 'age']
        },
        {
          model: User,
          as: 'friends',
          attributes: ['id', 'username', 'childName'],
          through: { attributes: [] }
        }
      ]
    });

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Регистрация родителя (только админ)
// @route   POST /api/auth/register-parent
// @access  Private/Admin
exports.registerParent = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Пожалуйста, укажите имя пользователя и пароль' 
      });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Пользователь с таким именем уже существует' 
      });
    }

    const parent = await User.create({
      username,
      password,
      role: 'parent'
    });

    res.status(201).json({
      success: true,
      message: 'Родитель успешно зарегистрирован',
      parent: {
        id: parent.id,
        username: parent.username,
        role: parent.role,
        credentials: {
          username: username,
          password: password
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Регистрация ребенка (родитель)
// @route   POST /api/auth/register-child
// @access  Private/Parent
exports.registerChild = async (req, res) => {
  try {
    const { username, password, childName, age } = req.body;

    if (!username || !password || !childName || !age) {
      return res.status(400).json({ 
        message: 'Пожалуйста, заполните все поля' 
      });
    }

    if (age < 2 || age > 6) {
      return res.status(400).json({ 
        message: 'Возраст должен быть от 2 до 6 лет' 
      });
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Пользователь с таким именем уже существует' 
      });
    }

    const child = await User.create({
      username,
      password,
      role: 'child',
      childName,
      age,
      parentId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Ребенок успешно зарегистрирован',
      child: {
        id: child.id,
        username: child.username,
        childName: child.childName,
        age: child.age,
        credentials: {
          username: username,
          password: password
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Удаление ребенка (только родитель своих детей)
// @route   DELETE /api/auth/child/:childId
// @access  Private/Parent
exports.deleteChild = async (req, res) => {
  try {
    const { childId } = req.params;
    const parentId = req.user.id;

    // Найти ребенка
    const child = await User.findOne({
      where: {
        id: childId,
        role: 'child',
        parentId: parentId // Проверяем что это ребенок текущего родителя
      }
    });

    if (!child) {
      return res.status(404).json({ 
        message: 'Ребенок не найден или у вас нет прав на его удаление' 
      });
    }

    // Удалить результаты игр ребенка
    const { GameResult } = require('../models');
    await GameResult.destroy({
      where: { childId: childId }
    });

    // Удалить ребенка
    await child.destroy();

    res.json({
      success: true,
      message: 'Ребенок удален'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
