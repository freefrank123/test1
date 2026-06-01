const express = require('express');
const quizController = require('../controllers/quiz.controller');

const router = express.Router();

router.get('/', quizController.getQuizList);
router.get('/random', quizController.getRandomQuiz);
router.post('/check', quizController.checkAnswer);

module.exports = router;