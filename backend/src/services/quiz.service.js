const { Quiz } = require('../models');

class QuizService {
  async getQuizList(limit = 10, shuffle = false) {
    let query = Quiz.findAll({
      limit: parseInt(limit),
      attributes: ['id', 'title', 'options', 'answer', 'explanation']
    });

    if (shuffle) {
      query = Quiz.findAll({
        limit: parseInt(limit),
        order: [['id', 'RAND()']],
        attributes: ['id', 'title', 'options', 'answer', 'explanation']
      });
    }

    return query;
  }

  async checkAnswer(quizId, userAnswer) {
    const quiz = await Quiz.findByPk(parseInt(quizId));
    
    if (!quiz) {
      throw new Error('题目不存在');
    }
    
    const correct = parseInt(userAnswer) === quiz.answer;
    
    return {
      correct,
      correctAnswer: quiz.answer,
      explanation: quiz.explanation
    };
  }

  async getRandomQuiz() {
    const count = await Quiz.count();
    const offset = Math.floor(Math.random() * count);
    return Quiz.findOne({
      offset,
      attributes: ['id', 'title', 'options', 'answer', 'explanation']
    });
  }

  async getQuizById(id) {
    return Quiz.findByPk(parseInt(id), {
      attributes: ['id', 'title', 'options', 'answer', 'explanation']
    });
  }

  async createQuiz(quizData) {
    return Quiz.create({
      title: quizData.title,
      options: quizData.options,
      answer: quizData.answer,
      explanation: quizData.explanation,
      category: quizData.category || 'earthquake'
    });
  }

  async updateQuiz(id, quizData) {
    const quiz = await Quiz.findByPk(parseInt(id));
    if (!quiz) {
      throw new Error('题目不存在');
    }
    return quiz.update(quizData);
  }

  async deleteQuiz(id) {
    const quiz = await Quiz.findByPk(parseInt(id));
    if (!quiz) {
      throw new Error('题目不存在');
    }
    return quiz.destroy();
  }
}

module.exports = new QuizService();