const { QuizResult, User, Quiz } = require('../models');
const { Op } = require('sequelize');

class QuizResultService {
  static async createQuizResult(data) {
    const { userId, quizId, score, totalQuestions, correctCount, answers } = data;
    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    
    await User.findOrCreate({
      where: { id: userId },
      defaults: {
        nickname: '用户',
        score: 0,
        quizCount: 0,
        correctCount: 0
      }
    });

    const result = await QuizResult.create({
      userId,
      quizId,
      score,
      totalQuestions,
      correctCount,
      answers,
      accuracy: Math.round(accuracy * 100) / 100
    });

    await User.increment({
      score: score,
      quizCount: 1,
      correctCount: correctCount
    }, {
      where: { id: userId }
    });

    return result;
  }

  static async getQuizResultsByUserId(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const { count, rows } = await QuizResult.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Quiz,
          attributes: ['title', 'category']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const results = rows.map((row, index) => {
      const result = row.toJSON();
      return {
        ...result,
        serialNumber: offset + index + 1
      };
    });

    return {
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      results
    };
  }

  static async getQuizResultById(id) {
    return await QuizResult.findByPk(id, {
      include: [
        {
          model: Quiz,
          attributes: ['title', 'category']
        }
      ]
    });
  }

  static async getUserQuizStats(userId) {
    const stats = await QuizResult.findAll({
      where: { userId },
      attributes: [
        [QuizResult.sequelize.fn('COUNT', QuizResult.sequelize.col('id')), 'totalQuizzes'],
        [QuizResult.sequelize.fn('SUM', QuizResult.sequelize.col('score')), 'totalScore'],
        [QuizResult.sequelize.fn('SUM', QuizResult.sequelize.col('correctCount')), 'totalCorrect'],
        [QuizResult.sequelize.fn('SUM', QuizResult.sequelize.col('totalQuestions')), 'totalQuestions'],
        [QuizResult.sequelize.fn('AVG', QuizResult.sequelize.col('accuracy')), 'avgAccuracy']
      ]
    });

    if (stats.length === 0) {
      return {
        totalQuizzes: 0,
        totalScore: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        avgAccuracy: 0
      };
    }

    const stat = stats[0].toJSON();
    return {
      totalQuizzes: parseInt(stat.totalQuizzes) || 0,
      totalScore: parseInt(stat.totalScore) || 0,
      totalCorrect: parseInt(stat.totalCorrect) || 0,
      totalQuestions: parseInt(stat.totalQuestions) || 0,
      avgAccuracy: Math.round((parseFloat(stat.avgAccuracy) || 0) * 100) / 100
    };
  }

  static async deleteQuizResult(id, userId) {
    const result = await QuizResult.findOne({
      where: { id, userId }
    });

    if (!result) {
      return null;
    }

    await result.destroy();
    return result;
  }
}

module.exports = QuizResultService;