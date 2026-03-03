const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GameResult = sequelize.define('GameResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  childId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  gameType: {
    type: DataTypes.ENUM(
      'memory',
      'odd-one-out',
      'sorting',
      'counting',
      'shadow-matching',
      'building',
      'predicting',
      'ar-adventure'
    ),
    allowNull: false
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  maxScore: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  timeSpent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Время в секундах'
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  details: {
    type: DataTypes.TEXT,
    get() {
      const rawValue = this.getDataValue('details');
      return rawValue ? JSON.parse(rawValue) : {};
    },
    set(value) {
      this.setDataValue('details', JSON.stringify(value));
    }
  },
  playedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'GameResults',
  indexes: [
    {
      fields: ['childId', 'playedAt']
    },
    {
      fields: ['childId', 'gameType']
    }
  ]
});

GameResult.associate = (models) => {
  GameResult.belongsTo(models.User, {
    foreignKey: 'childId',
    as: 'child'
  });
};

module.exports = GameResult;
