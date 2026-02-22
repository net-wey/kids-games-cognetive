const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FriendRequest = sequelize.define('FriendRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
    defaultValue: 'pending'
  }
}, {
  tableName: 'FriendRequests',
  indexes: [
    {
      unique: true,
      fields: ['senderId', 'receiverId']
    }
  ]
});

FriendRequest.associate = (models) => {
  FriendRequest.belongsTo(models.User, {
    foreignKey: 'senderId',
    as: 'sender'
  });
  
  FriendRequest.belongsTo(models.User, {
    foreignKey: 'receiverId',
    as: 'receiver'
  });
};

module.exports = FriendRequest;
