const sequelize = require('../config/database');
const Quiz = require('./Quiz');
const User = require('./User');

const db = {
  sequelize,
  Quiz,
  User
};

module.exports = db;