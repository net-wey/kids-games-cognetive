const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'parent', 'child'),
    allowNull: false
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  childName: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isValidAge(value) {
        // Проверяем возраст только для детей
        if (this.role === 'child') {
          if (value === null || value === undefined) {
            throw new Error('Возраст обязателен для детей');
          }
          if (value < 2 || value > 6) {
            throw new Error('Возраст ребенка должен быть от 2 до 6 лет');
          }
        }
      }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'Users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Метод для проверки пароля
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Ассоциации будут определены после экспорта всех моделей
User.associate = (models) => {
  // Родитель может иметь много детей
  User.hasMany(models.User, {
    as: 'children',
    foreignKey: 'parentId'
  });
  
  // Ребенок принадлежит родителю
  User.belongsTo(models.User, {
    as: 'parent',
    foreignKey: 'parentId'
  });

  // Друзья (many-to-many через таблицу Friends)
  User.belongsToMany(models.User, {
    as: 'friends',
    through: 'Friendships',
    foreignKey: 'userId',
    otherKey: 'friendId'
  });

  // Результаты игр
  User.hasMany(models.GameResult, {
    foreignKey: 'childId',
    as: 'gameResults'
  });

  // Отправленные запросы в друзья
  User.hasMany(models.FriendRequest, {
    foreignKey: 'senderId',
    as: 'sentRequests'
  });

  // Полученные запросы в друзья
  User.hasMany(models.FriendRequest, {
    foreignKey: 'receiverId',
    as: 'receivedRequests'
  });
};

module.exports = User;
