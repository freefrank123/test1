const express = require('express');
const QuizResultController = require('../controllers/QuizResultController');

const router = express.Router();

router.post('/', QuizResultController.createQuizResult);
router.get('/user/:userId', QuizResultController.getQuizResultsByUserId);
router.get('/user/:userId/stats', QuizResultController.getUserQuizStats);
router.get('/:id', QuizResultController.getQuizResultById);
router.delete('/:id', QuizResultController.deleteQuizResult);

module.exports = router;