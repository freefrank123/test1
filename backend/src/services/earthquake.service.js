require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

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
    try {
      const response = await fetch('https://api.ceic.ac.cn/earthquake', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return this.processCencData(data, limit);
      }
    } catch (err) {
      console.warn('无法连接到地震台网API，使用本地数据:', err);
    }

    return mockEarthquakeData.slice(0, limit);
  }

  async getEarthquakeNews(limit = 10) {
    return mockEarthquakeData.slice(0, limit).map(item => ({
      time: item.time,
      location: item.location,
      magnitude: item.magnitude,
      depth: item.depth,
      content: item.content
    }));
  }

  async searchEarthquakes(filters = {}, limit = 20) {
    let data = [...mockEarthquakeData];

    if (filters.minMagnitude !== undefined) {
      data = data.filter(item => parseFloat(item.magnitude) >= filters.minMagnitude);
    }

    if (filters.maxMagnitude !== undefined) {
      data = data.filter(item => parseFloat(item.magnitude) <= filters.maxMagnitude);
    }

    if (filters.startDate) {
      data = data.filter(item => item.time >= filters.startDate);
    }

    if (filters.endDate) {
      data = data.filter(item => item.time <= filters.endDate);
    }

    return data.slice(0, limit);
  }

  async getEmergencyInfo() {
    return emergencyInfo;
  }

  processCencData(data, limit = 10) {
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

    return list.slice(0, limit).map((item, index) => ({
      id: index + 1,
      time: item.O_TIME || item.time || item.OTime || '',
      location: item.EPI_CIRCLE || item.location || item.place || item.Epicenter || '',
      magnitude: item.M || item.magnitude || item.Magnitude || '',
      depth: item.EPI_DEPTH ? `${item.EPI_DEPTH}km` : (item.depth ? `${item.depth}km` : (item.Depth ? `${item.Depth}km` : '未知')),
      content: item.EPI_INFO || item.info || item.Description || '暂无详细信息'
    }));
  }
}

module.exports = new EarthquakeService();