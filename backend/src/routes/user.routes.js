// 济小震 · 用户数据路由
const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

const router = Router();

// 个人资料
router.get('/user/profile', authMiddleware, userController.getProfile);
router.put('/user/profile', authMiddleware, userController.updateProfile);

// 地震搜索历史
router.post('/user/search-history', authMiddleware, userController.addSearchHistory);
router.get('/user/search-history', authMiddleware, userController.getSearchHistory);

// AI 对话历史
router.post('/user/chat-history', authMiddleware, userController.addChatHistory);
router.get('/user/chat-history', authMiddleware, userController.getChatHistory);

// 测试积分
router.post('/user/scores', authMiddleware, userController.addTestScore);
router.get('/user/scores', authMiddleware, userController.getTestScores);

// 注销账户
router.delete('/user/account', authMiddleware, userController.deleteAccount);

module.exports = router;
