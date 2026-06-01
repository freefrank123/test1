const sequelize = require('../config/database');
const Quiz = require('./Quiz');
const User = require('./User');
const Knowledge = require('./Knowledge');
const QuizResult = require('./QuizResult');

const db = {
  sequelize,
  Quiz,
  User,
  Knowledge,
  QuizResult
};

module.exports = db;