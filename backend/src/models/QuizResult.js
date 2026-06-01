const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Quiz = require('./Quiz');

const QuizResult = sequelize.define('QuizResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Quiz,
      key: 'id'
    }
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  correctCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  answers: {
    type: DataTypes.JSON,
    allowNull: true
  },
  accuracy: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  }
}, {
  tableName: 'quiz_results',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

QuizResult.belongsTo(User, { foreignKey: 'userId' });
QuizResult.belongsTo(Quiz, { foreignKey: 'quizId' });

module.exports = QuizResult;