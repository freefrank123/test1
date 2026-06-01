// 济小震 · 用户数据控制器
const userService = require('../services/user.service');

// ==================== 个人资料 ====================

async function getProfile(req, res) {
  try {
    const profile = await userService.getProfile(req.user.id);
    res.json({
      success: true,
      data: profile
    });
  } catch (err) {
    console.error('获取个人资料失败:', err);
    res.status(500).json({
      success: false,
      message: '获取个人资料失败'
    });
  }
}

async function updateProfile(req, res) {
  try {
    const data = await userService.updateProfile(req.user.id, req.body);
    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('更新个人资料失败:', err);
    res.status(500).json({
      success: false,
      message: '更新个人资料失败'
    });
  }
}

// ==================== 搜索历史 ====================

async function addSearchHistory(req, res) {
  try {
    const { query, resultCount } = req.body;
    await userService.addSearchHistory(req.user.id, query, resultCount);
    res.json({ success: true });
  } catch (err) {
    console.error('保存搜索历史失败:', err);
    res.status(500).json({
      success: false,
      message: '保存搜索历史失败'
    });
  }
}

async function getSearchHistory(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const data = await userService.getSearchHistory(req.user.id, limit);
    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('获取搜索历史失败:', err);
    res.status(500).json({
      success: false,
      message: '获取搜索历史失败'
    });
  }
}

// ==================== 对话历史 ====================

async function addChatHistory(req, res) {
  try {
    const { userMessage, aiReply } = req.body;
    await userService.addChatHistory(req.user.id, userMessage, aiReply);
    res.json({ success: true });
  } catch (err) {
    console.error('保存对话历史失败:', err);
    res.status(500).json({
      success: false,
      message: '保存对话历史失败'
    });
  }
}

async function getChatHistory(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const data = await userService.getChatHistory(req.user.id, limit);
    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('获取对话历史失败:', err);
    res.status(500).json({
      success: false,
      message: '获取对话历史失败'
    });
  }
}

// ==================== 测试积分 ====================

async function addTestScore(req, res) {
  try {
    const { score, totalQuestions } = req.body;
    const data = await userService.addTestScore(req.user.id, score, totalQuestions);
    
    if (data === null) {
      res.json({
        success: false,
        message: '重复提交，已跳过'
      });
    } else {
      res.json({
        success: true,
        data
      });
    }
  } catch (err) {
    console.error('保存测试积分失败:', err);
    res.status(500).json({
      success: false,
      message: '保存测试积分失败'
    });
  }
}

async function getTestScores(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const data = await userService.getTestScores(req.user.id, limit);
    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('获取测试积分失败:', err);
    res.status(500).json({
      success: false,
      message: '获取测试积分失败'
    });
  }
}

async function deleteAllTestScores(req, res) {
  try {
    const count = await userService.deleteAllTestScores(req.user.id);
    res.json({
      success: true,
      message: `已删除 ${count} 条测试积分记录`
    });
  } catch (err) {
    console.error('删除测试积分失败:', err);
    res.status(500).json({
      success: false,
      message: '删除测试积分失败'
    });
  }
}

async function clearAllTestScores(req, res) {
  try {
    const count = await userService.clearAllTestScores();
    res.json({
      success: true,
      message: `已清除所有用户的 ${count} 条测试积分记录`
    });
  } catch (err) {
    console.error('清除测试积分失败:', err);
    res.status(500).json({
      success: false,
      message: '清除测试积分失败'
    });
  }
}

async function getAllTestScores(req, res) {
  try {
    const data = await userService.getAllTestScores();
    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('获取所有测试积分失败:', err);
    res.status(500).json({
      success: false,
      message: '获取所有测试积分失败'
    });
  }
}

// ==================== 注销账户 ====================

async function deleteAccount(req, res) {
  try {
    await userService.deleteAccount(req.user.id);
    res.json({ success: true, message: '账户已注销' });
  } catch (err) {
    console.error('注销账户失败:', err);
    res.status(500).json({
      success: false,
      message: '注销账户失败'
    });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
  addSearchHistory,
  getSearchHistory,
  addChatHistory,
  getChatHistory,
  addTestScore,
  getTestScores,
  deleteAllTestScores,
  clearAllTestScores,
  getAllTestScores
};