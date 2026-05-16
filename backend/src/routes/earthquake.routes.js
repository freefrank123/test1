const express = require('express');
const earthquakeController = require('../controllers/earthquake.controller');

const router = express.Router();

router.get('/earthquake/latest', earthquakeController.getLatest);
router.get('/earthquake/news', earthquakeController.getNews);
router.get('/earthquake/search', earthquakeController.search);
router.get('/earthquake/emergency', earthquakeController.getEmergencyInfo);

module.exports = router;