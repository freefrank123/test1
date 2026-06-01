const QuizResultService = require('../services/QuizResultService');

class QuizResultController {
  static async createQuizResult(req, res) {
    try {
      const { userId, quizId, score, totalQuestions, correctCount, answers } = req.body;
      
      if (!userId || !quizId || score === undefined || !totalQuestions) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数'
        });
      }

      const result = await QuizResultService.createQuizResult({
        userId,
        quizId,
        score,
        totalQuestions,
        correctCount: correctCount || 0,
        answers
      });

      res.status(201).json({
        success: true,
        message: '测验结果保存成功',
        data: result
      });
    } catch (error) {
      console.error('创建测验结果失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  static async getQuizResultsByUserId(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const results = await QuizResultService.getQuizResultsByUserId(
        parseInt(userId),
        parseInt(page),
        parseInt(limit)
      );

      res.status(200).json({
        success: true,
        message: '获取测验结果成功',
        data: results
      });
    } catch (error) {
      console.error('获取测验结果失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  static async getQuizResultById(req, res) {
    try {
      const { id } = req.params;

      const result = await QuizResultService.getQuizResultById(parseInt(id));

      if (!result) {
        return res.status(404).json({
          success: false,
          message: '测验结果不存在'
        });
      }

      res.status(200).json({
        success: true,
        message: '获取测验结果成功',
        data: result
      });
    } catch (error) {
      console.error('获取测验结果失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  static async getUserQuizStats(req, res) {
    try {
      const { userId } = req.params;

      const stats = await QuizResultService.getUserQuizStats(parseInt(userId));

      res.status(200).json({
        success: true,
        message: '获取用户测验统计成功',
        data: stats
      });
    } catch (error) {
      console.error('获取用户测验统计失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }

  static async deleteQuizResult(req, res) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const result = await QuizResultService.deleteQuizResult(parseInt(id), parseInt(userId));

      if (!result) {
        return res.status(404).json({
          success: false,
          message: '测验结果不存在或无权删除'
        });
      }

      res.status(200).json({
        success: true,
        message: '删除测验结果成功',
        data: result
      });
    } catch (error) {
      console.error('删除测验结果失败:', error);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}

module.exports = QuizResultController;