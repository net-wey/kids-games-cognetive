const { GameResult, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Сохранить результат игры
// @route   POST /api/games/result
// @access  Private/Child
exports.saveGameResult = async (req, res) => {
  try {
    const { gameType, level, score, maxScore, timeSpent, attempts, completed, details } = req.body;

    if (!gameType || score === undefined || maxScore === undefined || timeSpent === undefined) {
      return res.status(400).json({ 
        message: 'Пожалуйста, заполните все обязательные поля' 
      });
    }

    const gameResult = await GameResult.create({
      childId: req.user.id,
      gameType,
      level: level || 1,
      score,
      maxScore,
      timeSpent,
      attempts: attempts || 1,
      completed: completed || false,
      details: details || {}
    });

    res.status(201).json({
      success: true,
      message: 'Результат игры сохранен',
      gameResult
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Получить результаты игр ребенка
// @route   GET /api/games/results/:childId
// @access  Private
exports.getChildResults = async (req, res) => {
  try {
    const { childId } = req.params;
    const { gameType, limit = 50 } = req.query;

    const where = { childId: parseInt(childId) };
    if (gameType) {
      where.gameType = gameType;
    }

    const results = await GameResult.findAll({
      where,
      order: [['playedAt', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      count: results.length,
      results
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// @desc    Получить статистику ребенка
// @route   GET /api/games/statistics/:childId
// @access  Private
exports.getChildStatistics = async (req, res) => {
  try {
    const { childId } = req.params;

    const results = await GameResult.findAll({
      where: { childId: parseInt(childId) },
      order: [['playedAt', 'DESC']]
    });

    if (results.length === 0) {
      return res.json({
        success: true,
        statistics: {
          totalGames: 0,
          gameStats: {},
          recommendations: ['Начните с игры "Мемори" для развития памяти']
        }
      });
    }

    const gameStats = {};
    const gameTypes = [
      'memory', 'odd-one-out', 'sorting', 'counting', 
      'shadow-matching', 'building', 'predicting', 'ar-adventure'
    ];

    gameTypes.forEach(type => {
      const gameResults = results.filter(r => r.gameType === type);
      
      if (gameResults.length > 0) {
        const totalScore = gameResults.reduce((sum, r) => sum + r.score, 0);
        const totalMaxScore = gameResults.reduce((sum, r) => sum + r.maxScore, 0);
        const avgTime = gameResults.reduce((sum, r) => sum + r.timeSpent, 0) / gameResults.length;
        const completedGames = gameResults.filter(r => r.completed).length;

        gameStats[type] = {
          gamesPlayed: gameResults.length,
          totalScore,
          totalMaxScore,
          averageScore: (totalScore / totalMaxScore * 100).toFixed(2),
          averageTime: Math.round(avgTime),
          completedGames,
          completionRate: ((completedGames / gameResults.length) * 100).toFixed(2),
          lastPlayed: gameResults[0].playedAt
        };
      }
    });

    const recommendations = generateRecommendations(gameStats);

    res.json({
      success: true,
      statistics: {
        totalGames: results.length,
        gameStats,
        recommendations
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

// Функция генерации рекомендаций
function generateRecommendations(gameStats) {
  const recommendations = [];
  
  const gameNames = {
    'memory': 'Мемори',
    'odd-one-out': 'Найди лишнее',
    'sorting': 'Сортировка',
    'counting': 'Счет',
    'shadow-matching': 'Тени и Силуэты',
    'building': 'Построй по Образцу',
    'predicting': 'Что будет дальше?',
    'ar-adventure': 'AR Приключение'
  };

  const gameSkills = {
    'memory': 'развитие зрительной памяти и концентрации',
    'odd-one-out': 'развитие логического мышления и классификации',
    'sorting': 'развитие навыков классификации и логики',
    'counting': 'развитие математических навыков и счета',
    'shadow-matching': 'развитие зрительного восприятия',
    'building': 'развитие пространственного мышления',
    'predicting': 'развитие причинно-следственного мышления',
    'ar-adventure': 'развитие пространственного восприятия и взаимодействия с окружающим миром'
  };

  Object.entries(gameStats).forEach(([gameType, stats]) => {
    if (parseFloat(stats.averageScore) < 50) {
      recommendations.push(
        `🎯 Рекомендуется больше практики в игре "${gameNames[gameType]}" для ${gameSkills[gameType]}`
      );
    }
  });

  const allGames = Object.keys(gameNames);
  const playedGames = Object.keys(gameStats);
  const unplayedGames = allGames.filter(game => !playedGames.includes(game));

  if (unplayedGames.length > 0) {
    const randomGame = unplayedGames[0];
    recommendations.push(
      `✨ Попробуйте новую игру "${gameNames[randomGame]}" для ${gameSkills[randomGame]}`
    );
  }

  Object.entries(gameStats).forEach(([gameType, stats]) => {
    if (parseFloat(stats.averageScore) > 80 && stats.gamesPlayed > 3) {
      recommendations.push(
        `🌟 Отличные результаты в игре "${gameNames[gameType]}"! Ребенок хорошо справляется`
      );
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('Продолжайте регулярные занятия для развития когнитивных способностей');
  }

  return recommendations;
}

// @desc    Получить топ результатов среди друзей
// @route   GET /api/games/leaderboard
// @access  Private/Child
exports.getLeaderboard = async (req, res) => {
  try {
    const { gameType } = req.query;

    const user = await User.findByPk(req.user.id, {
      include: [{
        model: User,
        as: 'friends',
        attributes: ['id', 'username', 'childName'],
        through: { attributes: [] }
      }]
    });

    const friendIds = user.friends.map(f => f.id);
    friendIds.push(req.user.id);

    const leaderboard = [];

    for (const friendId of friendIds) {
      const where = { childId: friendId };
      if (gameType) {
        where.gameType = gameType;
      }

      const results = await GameResult.findAll({
        where,
        order: [['playedAt', 'DESC']],
        limit: 10
      });
      
      if (results.length > 0) {
        const totalScore = results.reduce((sum, r) => sum + r.score, 0);
        const friend = await User.findByPk(friendId, {
          attributes: ['id', 'username', 'childName']
        });
        
        leaderboard.push({
          userId: friendId,
          username: friend.username,
          childName: friend.childName,
          totalScore,
          gamesPlayed: results.length,
          isCurrentUser: friendId === req.user.id
        });
      }
    }

    leaderboard.sort((a, b) => b.totalScore - a.totalScore);

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
