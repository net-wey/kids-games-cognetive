const { User, GameResult } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

// @desc    Получить всех пользователей
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    
    const where = {};
    if (role) {
      where.role = role;
    }

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: User,
          as: 'children',
          attributes: ['id', 'username', 'childName', 'age']
        },
        {
          model: User,
          as: 'parent',
          attributes: ['id', 'username']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Деактивировать пользователя
// @route   PUT /api/admin/users/:userId/deactivate
// @access  Private/Admin
exports.deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Пользователь деактивирован',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Активировать пользователя
// @route   PUT /api/admin/users/:userId/activate
// @access  Private/Admin
exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'Пользователь активирован',
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Получить общую статистику приложения
// @route   GET /api/admin/statistics
// @access  Private/Admin
exports.getAppStatistics = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalParents = await User.count({ where: { role: 'parent' } });
    const totalChildren = await User.count({ where: { role: 'child' } });
    const activeUsers = await User.count({ where: { isActive: true } });
    
    const totalGames = await GameResult.count();
    
    // Статистика по играм за последние 7 дней
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentGames = await GameResult.count({
      where: {
        playedAt: { [Op.gte]: sevenDaysAgo }
      }
    });

    // Самые популярные игры
    const popularGames = await sequelize.query(
      'SELECT gameType, COUNT(*) as count FROM GameResults GROUP BY gameType ORDER BY count DESC',
      { type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      success: true,
      statistics: {
        users: {
          total: totalUsers,
          parents: totalParents,
          children: totalChildren,
          active: activeUsers
        },
        games: {
          total: totalGames,
          lastWeek: recentGames
        },
        popularGames
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Удалить пользователя
// @route   DELETE /api/admin/users/:userId
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      include: [{
        model: User,
        as: 'children'
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Если удаляем родителя, удалить всех его детей
    if (user.role === 'parent') {
      const childIds = user.children.map(child => child.id);
      
      // Удалить результаты детей
      await GameResult.destroy({
        where: { childId: { [Op.in]: childIds } }
      });
      
      // Удалить детей
      await User.destroy({
        where: { parentId: userId }
      });
    }

    // Если удаляем ребенка, удалить его результаты
    if (user.role === 'child') {
      await GameResult.destroy({
        where: { childId: userId }
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Пользователь удален'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
