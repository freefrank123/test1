const knowledgeService = require('../services/knowledge.service');

const knowledgeController = {
  async getAllKnowledge(req, res) {
    try {
      const knowledge = await knowledgeService.getAllKnowledge();
      res.json({ success: true, data: knowledge });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getKnowledgeByCategory(req, res) {
    try {
      const { category } = req.params;
      const validCategories = ['def', 'mag', 'firstaid', 'building'];
      
      if (!validCategories.includes(category)) {
        return res.status(400).json({ success: false, message: '无效的分类' });
      }
      
      const knowledge = await knowledgeService.getKnowledgeByCategory(category);
      res.json({ success: true, data: knowledge });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getKnowledgeById(req, res) {
    try {
      const { id } = req.params;
      const knowledge = await knowledgeService.getKnowledgeById(id);
      
      if (!knowledge) {
        return res.status(404).json({ success: false, message: '知识文章不存在' });
      }
      
      res.json({ success: true, data: knowledge });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async searchKnowledge(req, res) {
    try {
      const { keyword } = req.query;
      
      if (!keyword) {
        return res.status(400).json({ success: false, message: '请输入搜索关键词' });
      }
      
      const knowledge = await knowledgeService.searchKnowledge(keyword);
      res.json({ success: true, data: knowledge });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async createKnowledge(req, res) {
    try {
      const { title, content, category, summary, keywords, author, source } = req.body;
      
      if (!title || !content || !category) {
        return res.status(400).json({ success: false, message: '标题、内容和分类为必填项' });
      }
      
      const knowledge = await knowledgeService.createKnowledge({
        title,
        content,
        category,
        summary,
        keywords,
        author,
        source
      });
      
      res.status(201).json({ success: true, data: knowledge });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async updateKnowledge(req, res) {
    try {
      const { id } = req.params;
      const { title, content, category, summary, keywords, author, source } = req.body;
      
      const knowledge = await knowledgeService.updateKnowledge(id, {
        title,
        content,
        category,
        summary,
        keywords,
        author,
        source
      });
      
      if (!knowledge) {
        return res.status(404).json({ success: false, message: '知识文章不存在' });
      }
      
      res.json({ success: true, data: knowledge });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async deleteKnowledge(req, res) {
    try {
      const { id } = req.params;
      const success = await knowledgeService.deleteKnowledge(id);
      
      if (!success) {
        return res.status(404).json({ success: false, message: '知识文章不存在' });
      }
      
      res.json({ success: true, message: '删除成功' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getKnowledgeStats(req, res) {
    try {
      const stats = await knowledgeService.getKnowledgeStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = knowledgeController;