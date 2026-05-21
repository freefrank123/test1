const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  options: {
    type: DataTypes.JSON,
    allowNull: false
  },
  answer: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING(50),
    defaultValue: 'earthquake'
  }
}, {
  tableName: 'quizzes',
  timestamps: true
});

module.exports = Quiz;