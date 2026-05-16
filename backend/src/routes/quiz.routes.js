const express = require('express');
const quizController = require('../controllers/quiz.controller');

const router = express.Router();

router.get('/quiz', quizController.getQuizList);
router.get('/quiz/random', quizController.getRandomQuiz);
router.post('/quiz/check', quizController.checkAnswer);

module.exports = router;