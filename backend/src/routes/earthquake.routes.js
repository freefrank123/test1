const express = require('express');
const earthquakeController = require('../controllers/earthquake.controller');

const router = express.Router();

router.get('/latest', earthquakeController.getLatest);
router.get('/news', earthquakeController.getNews);
router.get('/search', earthquakeController.search);
router.get('/emergency', earthquakeController.getEmergencyInfo);

module.exports = router;