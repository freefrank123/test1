// 济小震 · 用户数据路由
const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

const router = Router();

// 个人资料
router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);

// 地震搜索历史
router.post('/search-history', authMiddleware, userController.addSearchHistory);
router.get('/search-history', authMiddleware, userController.getSearchHistory);

// AI 对话历史
router.post('/chat-history', authMiddleware, userController.addChatHistory);
router.get('/chat-history', authMiddleware, userController.getChatHistory);

// 测试积分
router.post('/scores', authMiddleware, userController.addTestScore);
router.get('/scores', authMiddleware, userController.getTestScores);
router.delete('/scores/all', authMiddleware, userController.deleteAllTestScores);
router.delete('/scores/clear', userController.clearAllTestScores);
router.get('/scores/list', userController.getAllTestScores);

// 注销账户
router.delete('/account', authMiddleware, userController.deleteAccount);

module.exports = router;