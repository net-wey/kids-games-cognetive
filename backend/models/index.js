const User = require('./User');
const GameResult = require('./GameResult');
const FriendRequest = require('./FriendRequest');

// Установка ассоциаций
const models = {
  User,
  GameResult,
  FriendRequest
};

// Вызов методов associate для каждой модели
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = models;

