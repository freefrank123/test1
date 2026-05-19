require('dotenv').config();
const https = require('https');

const mockEarthquakeData = [
  { id: 1, time: '2026-04-10 14:30:00', location: '山东济南', magnitude: '3.2', depth: '10km', content: '据中国地震台网测定，2026年4月10日14时30分在山东济南发生3.2级地震，震源深度10公里。目前无人员伤亡报告。' },
  { id: 2, time: '2026-04-09 08:15:00', location: '河北唐山', magnitude: '2.8', depth: '8km', content: '2026年4月9日08时15分，河北唐山发生2.8级地震，震源深度8公里。当地居民有明显震感，但无财产损失。' },
  { id: 3, time: '2026-04-08 22:45:00', location: '四川成都', magnitude: '3.0', depth: '12km', content: '四川成都于2026年4月8日22时45分发生3.0级地震，震源深度12公里。地震发生后，当地应急部门迅速响应。' },
  { id: 4, time: '2026-04-07 16:20:00', location: '云南昆明', magnitude: '3.5', depth: '15km', content: '2026年4月7日16时20分，云南昆明发生3.5级地震，震源深度15公里。部分老旧房屋出现轻微裂缝。' },
  { id: 5, time: '2026-04-06 10:10:00', location: '甘肃兰州', magnitude: '2.9', depth: '9km', content: '甘肃兰州于2026年4月6日10时10分发生2.9级地震，震源深度9公里。当地居民反映有震感，但未造成破坏。' },
  { id: 6, time: '2026-04-05 19:35:00', location: '青海西宁', magnitude: '3.1', depth: '11km', content: '2026年4月5日19时35分，青海西宁发生3.1级地震，震源深度11公里。目前正在核查灾情。' },
  { id: 7, time: '2026-04-04 13:00:00', location: '新疆乌鲁木齐', magnitude: '4.2', depth: '20km', content: '新疆乌鲁木齐于2026年4月4日13时发生4.2级地震，震源深度20公里。部分地区电力短暂中断。' },
  { id: 8, time: '2026-04-03 06:45:00', location: '陕西西安', magnitude: '2.6', depth: '7km', content: '2026年4月3日06时45分，陕西西安发生2.6级地震，震源深度7公里。居民反映有轻微震感。' }
];

const emergencyInfo = {
  hotline: {
    police: '110',
    fire: '119',
    medical: '120',
    emergency: '12395'
  },
  preparedness: [
    '准备应急包：水、食物、手电筒、急救药品',
    '熟悉逃生路线，确定家庭安全区域',
    '定期进行家庭地震演练',
    '检查家中家具是否稳固，避免倾倒',
    '了解所在地区的地震风险'
  ],
  during: [
    '保持冷静，不要惊慌',
    '迅速躲到坚固家具下方或承重墙根',
    '远离窗户、玻璃、吊灯等易碎物品',
    '在室外远离建筑物、大树、电线杆',
    '在车内立即靠边停车，留在车内'
  ],
  after: [
    '检查燃气、电路是否安全',
    '避免返回危险建筑物',
    '听从救援人员指挥',
    '注意防范余震',
    '使用手机保持联系，节约电量'
  ]
};

class EarthquakeService {
  async getLatestEarthquakes(limit = 10) {
    const apiUrls = [
      'https://api.wolfx.jp/cenc_eqlist.json',
      'https://api.wolfx.jp/cenc_eew.json',
      'https://api.wolfx.jp/sc_eew.json',
      'https://api.wolfx.jp/fj_eew.json',
      'https://api.wolfx.jp/cq_eew.json',
      'https://www.cenc.ac.cn/ceic_api/api/earthquake'
    ];

    for (let i = 0; i < apiUrls.length; i++) {
      const url = apiUrls[i];
      try {
        console.log('API尝试:', url);
        
        const urlObj = new URL(url);
        console.log('主机:', urlObj.hostname);
        
        const result = await this.httpGet(urlObj);
        
        if (result.success) {
          console.log('成功获取数据');
          let processed = null;
          if (url.includes('wolfx')) {
            processed = this.processWolfxData(result.data, limit);
          } else {
            processed = this.processCencData(result.data, limit);
          }
          
          if (processed && processed.length > 0) {
            return processed;
          }
        }
      } catch (err) {
        console.log('错误:', url, err.message);
      }
    }

    console.log('使用本地数据');
    return mockEarthquakeData.slice(0, limit);
  }

  httpGet(urlObj) {
    return new Promise(function(resolve, reject) {
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 15000
      };

      const req = https.request(options, function(res) {
        let data = '';
        res.on('data', function(chunk) {
          data += chunk;
        });
        res.on('end', function() {
          try {
            const jsonData = JSON.parse(data);
            resolve({ success: true, data: jsonData });
          } catch (err) {
            reject(new Error('JSON解析失败'));
          }
        });
      });

      req.on('error', function(e) {
        reject(e);
      });

      req.on('timeout', function() {
        req.destroy();
        reject(new Error('请求超时'));
      });

      req.setTimeout(15000);
      req.end();
    });
  }

  async getEarthquakeNews(limit = 10) {
    return mockEarthquakeData.slice(0, limit).map(function(item) {
      return {
        time: item.time,
        location: item.location,
        magnitude: item.magnitude,
        depth: item.depth,
        content: item.content
      };
    });
  }

  async searchEarthquakes(filters = {}, limit = 20) {
    let allData = [];
    
    try {
      // 先从API获取最新数据
      const apiUrls = [
        'https://api.wolfx.jp/cenc_eqlist.json',
        'https://api.wolfx.jp/cenc_eew.json',
        'https://api.wolfx.jp/sc_eew.json',
        'https://api.wolfx.jp/fj_eew.json',
        'https://api.wolfx.jp/cq_eew.json'
      ];
      
      for (let i = 0; i < apiUrls.length && allData.length < 100; i++) {
        try {
          const url = apiUrls[i];
          const urlObj = new URL(url);
          const result = await this.httpGet(urlObj);
          
          if (result.success) {
            let processed = null;
            if (url.includes('wolfx')) {
              processed = this.processWolfxData(result.data, 50);
            } else {
              processed = this.processCencData(result.data, 50);
            }
            
            if (processed && processed.length > 0) {
              // 去重
              const existingIds = new Set(allData.map(item => item.time + item.location + item.magnitude));
              processed.forEach(item => {
                const key = item.time + item.location + item.magnitude;
                if (!existingIds.has(key)) {
                  allData.push(item);
                  existingIds.add(key);
                }
              });
            }
          }
        } catch (err) {
          console.log('获取API数据失败:', err.message);
        }
      }
    } catch (err) {
      console.log('搜索时获取API数据失败:', err.message);
    }
    
    // 添加mock数据作为补充
    const existingIds = new Set(allData.map(item => item.time + item.location + item.magnitude));
    mockEarthquakeData.forEach(item => {
      const key = item.time + item.location + item.magnitude;
      if (!existingIds.has(key)) {
        allData.push(item);
      }
    });

    // 应用筛选条件
    if (filters.minMagnitude !== undefined) {
      allData = allData.filter(function(item) {
        const mag = parseFloat(item.magnitude);
        return !isNaN(mag) && mag >= filters.minMagnitude;
      });
    }

    if (filters.maxMagnitude !== undefined) {
      allData = allData.filter(function(item) {
        const mag = parseFloat(item.magnitude);
        return !isNaN(mag) && mag <= filters.maxMagnitude;
      });
    }

    if (filters.startDate) {
      allData = allData.filter(function(item) {
        return item.time && item.time >= filters.startDate;
      });
    }

    if (filters.endDate) {
      allData = allData.filter(function(item) {
        return item.time && item.time <= filters.endDate;
      });
    }

    // 按时间排序（最新在前）
    allData.sort(function(a, b) {
      return (b.time || '').localeCompare(a.time || '');
    });

    return allData.slice(0, limit);
  }

  async getEmergencyInfo() {
    return emergencyInfo;
  }

  processWolfxData(data, limit) {
    if (!data) return null;
    
    let list = [];
    
    // 尝试多种数据格式
    // 格式1: No1, No2, No3... 格式
    const noKeys = Object.keys(data).filter(function(key) { return key.startsWith('No'); });
    if (noKeys.length > 0) {
      list = noKeys
        .sort(function(a, b) { return parseInt(a.replace('No', '')) - parseInt(b.replace('No', '')); })
        .map(function(key) { return data[key]; })
        .filter(function(item) { return item && (item.time || item.location || item.magnitude); });
    } 
    // 格式2: 直接数组格式
    else if (Array.isArray(data)) {
      list = data.filter(function(item) { return item && (item.time || item.location || item.magnitude); });
    }
    // 格式3: data.result 或 data.list
    else if (data.data && Array.isArray(data.data)) {
      list = data.data.filter(function(item) { return item && (item.time || item.location || item.magnitude); });
    }
    else if (data.result && Array.isArray(data.result)) {
      list = data.result.filter(function(item) { return item && (item.time || item.location || item.magnitude); });
    }
    else if (data.list && Array.isArray(data.list)) {
      list = data.list.filter(function(item) { return item && (item.time || item.location || item.magnitude); });
    }
    // 格式4: features数组（GeoJSON格式）
    else if (data.features && Array.isArray(data.features)) {
      list = data.features.map(function(f) { return f.properties || f; })
        .filter(function(item) { return item && (item.time || item.location || item.magnitude); });
    }

    if (list.length === 0) return null;

    return list.slice(0, limit).map(function(item, index) {
      const mag = item.magnitude || item.M || item.mag || item.magnitude_value || '';
      const loc = item.location || item.placeName || item.place || item.EPI_CIRCLE || item.Epicenter || '';
      const tm = item.time || item.O_TIME || item.OTime || item.origin_time || '';
      const dp = item.depth || item.EPI_DEPTH || item.depth_value || '';
      
      return {
        id: index + 1,
        time: tm,
        location: loc,
        magnitude: mag,
        depth: dp ? (String(dp).includes('km') ? dp : dp + 'km') : '未知',
        content: '据中国地震台网测定，' + loc + '于' + tm + '发生' + mag + '级地震，震源深度' + (dp || '未知') + '公里。'
      };
    });
  }

  processCencData(data, limit) {
    if (!data || (!data.data && !data.result && !data.list)) {
      return null;
    }

    let list = [];

    if (data.data && Array.isArray(data.data)) {
      list = data.data;
    } else if (data.result && Array.isArray(data.result)) {
      list = data.result;
    } else if (data.list && Array.isArray(data.list)) {
      list = data.list;
    } else if (Array.isArray(data)) {
      list = data;
    }

    if (list.length === 0) return null;

    return list.slice(0, limit).map(function(item, index) {
      var depth = item.EPI_DEPTH || item.depth || item.Depth || '';
      depth = depth ? (String(depth).includes('km') ? depth : depth + 'km') : '未知';
      return {
        id: index + 1,
        time: item.O_TIME || item.time || item.OTime || '',
        location: item.EPI_CIRCLE || item.location || item.place || item.Epicenter || '',
        magnitude: item.M || item.magnitude || item.Magnitude || '',
        depth: depth,
        content: item.EPI_INFO || item.info || item.Description || '暂无详细信息'
      };
    });
  }
}

module.exports = new EarthquakeService();