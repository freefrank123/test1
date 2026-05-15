const aiService = require('../services/ai.service');

class ChatController {
  async getAnswer(req, res) {
    try {
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({
          success: false,
          message: '请输入问题'
        });
      }

      const result = await aiService.getAIAnswer(question);
      
      if (result.success) {
        res.json({
          success: true,
          answer: result.answer
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message
        });
      }
    } catch (err) {
      console.error('ChatController异常:', err);
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  }
}

module.exports = new ChatController();