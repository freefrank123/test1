const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Knowledge = sequelize.define('Knowledge', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['def', 'mag', 'firstaid', 'building']]
    }
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  keywords: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  author: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  source: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'knowledge',
  timestamps: true
});

module.exports = Knowledge;