const express = require('express');
const QuizResultController = require('../controllers/QuizResultController');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/', authMiddleware, QuizResultController.createQuizResult);
router.get('/user/:userId', authMiddleware, QuizResultController.getQuizResultsByUserId);
router.get('/user/:userId/stats', authMiddleware, QuizResultController.getUserQuizStats);
router.get('/:id', authMiddleware, QuizResultController.getQuizResultById);
router.delete('/:id', authMiddleware, QuizResultController.deleteQuizResult);

module.exports = router;