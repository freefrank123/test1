const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  openid: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: true
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  score: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  quizCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  correctCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;