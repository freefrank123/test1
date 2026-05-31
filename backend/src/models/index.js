const sequelize = require('../config/database');
const Quiz = require('./Quiz');
const User = require('./User');
const Knowledge = require('./Knowledge');

const db = {
  sequelize,
  Quiz,
  User,
  Knowledge
};

module.exports = db;