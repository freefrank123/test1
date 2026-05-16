const quizService = require('../services/quiz.service');

class QuizController {
  async getQuizList(req, res) {
    try {
      const { limit, shuffle } = req.query;
      const quizList = await quizService.getQuizList(parseInt(limit) || 10, shuffle === 'true');
      
      res.json({
        success: true,
        data: quizList
      });
    } catch (err) {
      console.error('QuizController异常:', err);
      res.status(500).json({
        success: false,
        message: '获取测验题库失败'
      });
    }
  }

  async checkAnswer(req, res) {
    try {
      const { quizId, userAnswer } = req.body;
      
      if (quizId === undefined || userAnswer === undefined) {
        return res.status(400).json({
          success: false,
          message: '参数缺失'
        });
      }

      const result = await quizService.checkAnswer(quizId, userAnswer);
      
      res.json({
        success: true,
        correct: result.correct,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation
      });
    } catch (err) {
      console.error('QuizController异常:', err);
      res.status(500).json({
        success: false,
        message: '验证答案失败'
      });
    }
  }

  async getRandomQuiz(req, res) {
    try {
      const quiz = await quizService.getRandomQuiz();
      
      if (quiz) {
        res.json({
          success: true,
          data: quiz
        });
      } else {
        res.status(404).json({
          success: false,
          message: '暂无测验题目'
        });
      }
    } catch (err) {
      console.error('QuizController异常:', err);
      res.status(500).json({
        success: false,
        message: '获取随机题目失败'
      });
    }
  }
}

module.exports = new QuizController();