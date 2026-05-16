const earthquakeService = require('../services/earthquake.service');

class EarthquakeController {
  async getLatest(req, res) {
    try {
      const { limit } = req.query;
      const data = await earthquakeService.getLatestEarthquakes(parseInt(limit) || 10);
      
      res.json({
        success: true,
        data: data
      });
    } catch (err) {
      console.error('EarthquakeController异常:', err);
      res.status(500).json({
        success: false,
        message: '获取地震数据失败'
      });
    }
  }

  async getNews(req, res) {
    try {
      const { limit } = req.query;
      const news = await earthquakeService.getEarthquakeNews(parseInt(limit) || 10);
      
      res.json({
        success: true,
        data: news
      });
    } catch (err) {
      console.error('EarthquakeController异常:', err);
      res.status(500).json({
        success: false,
        message: '获取地震新闻失败'
      });
    }
  }

  async search(req, res) {
    try {
      const { min_mag, max_mag, start_date, end_date, limit } = req.query;
      
      const filters = {};
      if (min_mag) filters.minMagnitude = parseFloat(min_mag);
      if (max_mag) filters.maxMagnitude = parseFloat(max_mag);
      if (start_date) filters.startDate = start_date;
      if (end_date) filters.endDate = end_date;
      
      const data = await earthquakeService.searchEarthquakes(filters, parseInt(limit) || 20);
      
      res.json({
        success: true,
        data: data
      });
    } catch (err) {
      console.error('EarthquakeController异常:', err);
      res.status(500).json({
        success: false,
        message: '搜索地震数据失败'
      });
    }
  }

  async getEmergencyInfo(req, res) {
    try {
      const info = await earthquakeService.getEmergencyInfo();
      
      res.json({
        success: true,
        data: info
      });
    } catch (err) {
      console.error('EarthquakeController异常:', err);
      res.status(500).json({
        success: false,
        message: '获取应急信息失败'
      });
    }
  }
}

module.exports = new EarthquakeController();