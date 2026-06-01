const express = require('express');
const knowledgeController = require('../controllers/knowledge.controller');

const router = express.Router();

router.get('/', knowledgeController.getAllKnowledge);
router.get('/category/:category', knowledgeController.getKnowledgeByCategory);
router.get('/search', knowledgeController.searchKnowledge);
router.get('/stats', knowledgeController.getKnowledgeStats);
router.get('/:id', knowledgeController.getKnowledgeById);
router.post('/', knowledgeController.createKnowledge);
router.put('/:id', knowledgeController.updateKnowledge);
router.delete('/:id', knowledgeController.deleteKnowledge);

module.exports = router;