const { Knowledge } = require('../models');

const knowledgeService = {
  async getAllKnowledge() {
    return await Knowledge.findAll({
      order: [['createdAt', 'DESC']]
    });
  },

  async getKnowledgeByCategory(category) {
    return await Knowledge.findAll({
      where: { category },
      order: [['createdAt', 'DESC']]
    });
  },

  async getKnowledgeById(id) {
    const knowledge = await Knowledge.findByPk(id);
    if (knowledge) {
      knowledge.viewCount += 1;
      await knowledge.save();
    }
    return knowledge;
  },

  async searchKnowledge(keyword) {
    return await Knowledge.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { title: { [require('sequelize').Op.like]: `%${keyword}%` } },
          { content: { [require('sequelize').Op.like]: `%${keyword}%` } },
          { keywords: { [require('sequelize').Op.like]: `%${keyword}%` } }
        ]
      },
      order: [['viewCount', 'DESC']]
    });
  },

  async createKnowledge(data) {
    return await Knowledge.create(data);
  },

  async updateKnowledge(id, data) {
    const knowledge = await Knowledge.findByPk(id);
    if (!knowledge) return null;
    return await knowledge.update(data);
  },

  async deleteKnowledge(id) {
    const knowledge = await Knowledge.findByPk(id);
    if (!knowledge) return false;
    await knowledge.destroy();
    return true;
  },

  async getKnowledgeStats() {
    const defCount = await Knowledge.count({ where: { category: 'def' } });
    const magCount = await Knowledge.count({ where: { category: 'mag' } });
    const firstaidCount = await Knowledge.count({ where: { category: 'firstaid' } });
    const buildingCount = await Knowledge.count({ where: { category: 'building' } });
    
    return {
      total: defCount + magCount + firstaidCount + buildingCount,
      categories: {
        def: defCount,
        mag: magCount,
        firstaid: firstaidCount,
        building: buildingCount
      }
    };
  }
};

module.exports = knowledgeService;