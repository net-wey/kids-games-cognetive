const { User, FriendRequest } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

// @desc    Отправить запрос в друзья
// @route   POST /api/friends/request
// @access  Private/Child
exports.sendFriendRequest = async (req, res) => {
  try {
    const { receiverUsername } = req.body;

    if (!receiverUsername) {
      return res.status(400).json({ message: 'Укажите имя пользователя' });
    }

    const receiver = await User.findOne({ 
      where: { 
        username: receiverUsername, 
        role: 'child' 
      } 
    });

    if (!receiver) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    if (receiver.id === req.user.id) {
      return res.status(400).json({ message: 'Нельзя добавить себя в друзья' });
    }

    // Проверить, не являются ли уже друзьями
    const areFriends = await sequelize.query(
      'SELECT * FROM Friendships WHERE (userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?)',
      {
        replacements: [req.user.id, receiver.id, receiver.id, req.user.id],
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (areFriends.length > 0) {
      return res.status(400).json({ message: 'Вы уже друзья' });
    }

    // Проверить существующий запрос
    const existingRequest = await FriendRequest.findOne({
      where: {
        [Op.or]: [
          { senderId: req.user.id, receiverId: receiver.id },
          { senderId: receiver.id, receiverId: req.user.id }
        ],
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Запрос уже отправлен' });
    }

    const friendRequest = await FriendRequest.create({
      senderId: req.user.id,
      receiverId: receiver.id
    });

    res.status(201).json({
      success: true,
      message: 'Запрос в друзья отправлен',
      friendRequest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Получить входящие запросы в друзья
// @route   GET /api/friends/requests
// @access  Private/Child
exports.getFriendRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.findAll({
      where: {
        receiverId: req.user.id,
        status: 'pending'
      },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'username', 'childName']
      }]
    });

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Принять запрос в друзья
// @route   PUT /api/friends/accept/:requestId
// @access  Private/Child
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findByPk(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: 'Запрос не найден' });
    }

    if (friendRequest.receiverId !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    friendRequest.status = 'accepted';
    await friendRequest.save();

    // Добавить в друзья обоим пользователям
    await sequelize.query(
      'INSERT OR IGNORE INTO Friendships (userId, friendId, createdAt, updatedAt) VALUES (?, ?, datetime("now"), datetime("now"))',
      { replacements: [friendRequest.senderId, friendRequest.receiverId] }
    );

    await sequelize.query(
      'INSERT OR IGNORE INTO Friendships (userId, friendId, createdAt, updatedAt) VALUES (?, ?, datetime("now"), datetime("now"))',
      { replacements: [friendRequest.receiverId, friendRequest.senderId] }
    );

    res.json({
      success: true,
      message: 'Запрос принят'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Отклонить запрос в друзья
// @route   PUT /api/friends/reject/:requestId
// @access  Private/Child
exports.rejectFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const friendRequest = await FriendRequest.findByPk(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: 'Запрос не найден' });
    }

    if (friendRequest.receiverId !== req.user.id) {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    friendRequest.status = 'rejected';
    await friendRequest.save();

    res.json({
      success: true,
      message: 'Запрос отклонен'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Получить список друзей
// @route   GET /api/friends
// @access  Private/Child
exports.getFriends = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: User,
        as: 'friends',
        attributes: ['id', 'username', 'childName', 'age'],
        through: { attributes: [] }
      }]
    });

    res.json({
      success: true,
      count: user.friends.length,
      friends: user.friends
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Удалить из друзей
// @route   DELETE /api/friends/:friendId
// @access  Private/Child
exports.removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;

    // Удалить из друзей обоих пользователей
    await sequelize.query(
      'DELETE FROM Friendships WHERE (userId = ? AND friendId = ?) OR (userId = ? AND friendId = ?)',
      { replacements: [req.user.id, friendId, friendId, req.user.id] }
    );

    res.json({
      success: true,
      message: 'Друг удален'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
