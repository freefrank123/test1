// 济小震 · 数据展示模块
class DataModule {
  constructor() {
    this.newsContainer = null;
    this.tableContainer = null;
  }

  init() {
    // 获取DOM元素
    this.newsContainer = document.getElementById('newsList');
    this.tableContainer = document.getElementById('earthquakeTable');

    // 自动加载数据
    this.loadNews();
    this.loadEarthquakeData();

    console.log('✅ 数据展示模块初始化完成');
  }

  async loadNews() {
    if (!this.newsContainer) return;

    let news = [];

    // 优先尝试从中国地震台网获取实时数据
    if (window.JiXiaoZhen && window.JiXiaoZhen.API) {
      const cencData = await window.JiXiaoZhen.API.getLatestEarthquakes(10);
      if (cencData && cencData.length > 0) {
        news = cencData;
        console.log('✅ 已从中国地震台网获取实时地震数据');
      } else {
        // 备用：从本地API获取
        news = await window.JiXiaoZhen.API.apiGetNews();
      }
    } else {
      // 本地mock数据
      try {
        const response = await fetch('../mock/news.json');
        news = await response.json();
      } catch (err) {
        console.error('加载新闻数据失败：', err);
        this.newsContainer.innerHTML = '<p>加载新闻失败</p>';
        return;
      }
    }

    if (news.length === 0) {
      this.newsContainer.innerHTML = '<p>暂无地震新闻</p>';
      return;
    }

    this.newsContainer.innerHTML = news.map(item => `
      <div class="news-item" style="padding:1rem; border-bottom:1px solid #eee; margin-bottom:.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h4 style="margin:0; color:#2c3e50;">${item.location}发生${item.magnitude}级地震</h4>
          <span style="font-size:.85rem; color:#999;">${item.time}</span>
        </div>
        <p style="margin:.5rem 0 0; color:#666; font-size:.9rem;">${item.content || '暂无详细信息'}</p>
      </div>
    `).join('');
  }

  async loadEarthquakeData() {
    if (!this.tableContainer) return;

    let data = [];

    // 优先尝试从中国地震台网获取实时数据
    if (window.JiXiaoZhen && window.JiXiaoZhen.API) {
      const cencData = await window.JiXiaoZhen.API.getLatestEarthquakes(20);
      if (cencData && cencData.length > 0) {
        data = cencData;
        console.log('✅ 已从中国地震台网获取历史地震数据');
      } else {
        // 备用：从本地API获取
        data = await window.JiXiaoZhen.API.apiGetEarthquakeData();
      }
    } else {
      // 本地mock数据
      try {
        const response = await fetch('../mock/news.json');
        data = await response.json();
      } catch (err) {
        console.error('加载地震数据失败：', err);
        const tableBody = this.tableContainer.querySelector('tbody');
        if (tableBody) {
          tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">加载数据失败</td></tr>';
        }
        return;
      }
    }

    const tableBody = this.tableContainer.querySelector('tbody');
    if (!tableBody) return;

    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">暂无历史地震数据</td></tr>';
      return;
    }

    tableBody.innerHTML = data.map(item => `
      <tr>
        <td>${item.time}</td>
        <td>${item.location}</td>
        <td>${item.magnitude}</td>
        <td>${item.depth || '未知'}</td>
      </tr>
    `).join('');
  }

  async searchEarthquake(filters) {
    // 根据筛选条件搜索地震数据
    console.log('搜索参数：', filters);
    
    const tableBody = this.tableContainer.querySelector('tbody');
    if (!tableBody) return;
    
    // 优先尝试从中国地震台网获取筛选后的数据
    if (window.JiXiaoZhen && window.JiXiaoZhen.API) {
      const cencData = await window.JiXiaoZhen.API.getCencEarthquakeData(filters);
      if (cencData && cencData.length > 0) {
        tableBody.innerHTML = cencData.map(item => `
          <tr>
            <td>${item.time}</td>
            <td>${item.location}</td>
            <td>${item.magnitude}</td>
            <td>${item.depth || '未知'}</td>
          </tr>
        `).join('');
        console.log('✅ 已从中国地震台网获取筛选后的地震数据');
        return;
      }
    }
    
    // 备用：使用本地数据
    this.loadEarthquakeData();
  }
}

// 暴露到全局
window.JiXiaoZhen = window.JiXiaoZhen || {};
window.JiXiaoZhen.Data = new DataModule();
window.JiXiaoZhen.initData = () => window.JiXiaoZhen.Data.init();
window.loadNewsData = () => window.JiXiaoZhen.Data.loadNews();
window.displayEarthquakeData = () => window.JiXiaoZhen.Data.loadEarthquakeData();