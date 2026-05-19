// 济小震 · API接口模块
const API_BASE_URL = 'http://localhost:5000/api';

// 中国地震台网公开API配置
const CENC_PUBLIC_URL = 'https://www.cenc.ac.cn';

// 获取中国地震台网最新地震速报数据（使用官方公开接口）
async function getLatestEarthquakes(limit = 10) {
  try {
    // 使用fetch获取地震数据（通过CORS代理或直接请求）
    const response = await fetch('https://api.ceic.ac.cn/earthquake', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': '*'
      }
    });
    
    if (!response.ok) {
      // 如果主接口失败，尝试备用接口
      console.warn('主接口请求失败，尝试备用接口');
      return await getEarthquakeBackup();
    }
    
    const data = await response.json();
    return processCencData(data, limit);
  } catch (err) {
    console.error('获取地震数据失败，使用备用方案:', err);
    return await getEarthquakeBackup();
  }
}

// 备用接口：获取地震数据
async function getEarthquakeBackup() {
  try {
    // 使用JSONP方式获取数据
    return new Promise((resolve) => {
      const callbackName = `cenc_callback_${Date.now()}`;
      const script = document.createElement('script');
      script.src = `https://www.cenc.ac.cn/ceic_api/api/earthquake?callback=${callbackName}&num=20`;
      
      window[callbackName] = function(data) {
        try {
          const result = processCencData(data, 10);
          resolve(result);
        } catch (e) {
          console.error('解析JSONP数据失败:', e);
          resolve(null);
        } finally {
          delete window[callbackName];
          document.body.removeChild(script);
        }
      };
      
      script.onerror = function() {
        console.error('JSONP加载失败，返回mock数据');
        delete window[callbackName];
        resolve(null);
      };
      
      document.body.appendChild(script);
    });
  } catch (err) {
    console.error('备用接口请求失败:', err);
    return null;
  }
}

// 处理中国地震台网返回的数据格式
function processCencData(data, limit = 10) {
  if (!data || (!data.data && !data.result && !data.list)) {
    return null;
  }
  
  let list = [];
  
  // 支持多种数据格式
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
  
  // 截取指定数量并转换格式
  return list.slice(0, limit).map(item => ({
    time: item.O_TIME || item.time || item.OTime || '',
    location: item.EPI_CIRCLE || item.location || item.place || item.Epicenter || '',
    magnitude: item.M || item.magnitude || item.Magnitude || '',
    depth: (() => { const d = item.depth || item.EPI_DEPTH || item.Depth || ''; return d ? (d.toString().includes('km') ? d : `${d}km`) : '未知'; })(),
    content: item.EPI_INFO || item.info || item.Description || '暂无详细信息'
  }));
}

// 获取中国地震台网历史地震数据（支持筛选条件）
async function getCencEarthquakeData(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    if (filters.magCondition) {
      if (filters.magCondition.min) params.append('min_mag', filters.magCondition.min);
      if (filters.magCondition.max) params.append('max_mag', filters.magCondition.max);
    }
    
    if (filters.dateCondition) {
      if (filters.dateCondition.start) params.append('start', filters.dateCondition.start);
      if (filters.dateCondition.end) params.append('end', filters.dateCondition.end);
    }
    
    params.append('num', filters.limit || 50);
    
    const response = await fetch(`https://api.ceic.ac.cn/search?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return processCencData(data, filters.limit);
  } catch (err) {
    console.error('获取历史地震数据失败:', err);
    return null;
  }
}

// 获取AI回答（调用本地后端API）
async function getAIAnswerRemote(userText) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: userText
      })
    });

    const data = await response.json();
    if (response.ok && data.success) {
      return data.answer;
    } else {
      console.warn('后端API返回错误:', data.message);
      return getAIAnswerLocal(userText);
    }
  } catch (err) {
    console.error('调用本地后端失败，使用本地mock数据:', err);
    return getAIAnswerLocal(userText);
  }
}

// 本地AI回答（使用mock数据）
async function getAIAnswerLocal(userText) {
  try {
    const response = await fetch('../../mock/chat.json');
    const data = await response.json();
    for (const [key, value] of Object.entries(data)) {
      if (userText.includes(key)) {
        return value;
      }
    }
    return '我是济小震地震应急助手，请问有什么可以帮助你的？';
  } catch (err) {
    return '抱歉，暂时无法回答你的问题';
  }
}

// 处理API输出
function processOutput(output) {
  if (typeof output === 'string') return output.trim();
  if (Array.isArray(output)) {
    return output.map(item => {
      if (typeof item === 'string') return item;
      if (item?.text) return item.text;
      if (item?.content) return processOutput(item.content);
      return String(item);
    }).join(' ').trim();
  }
  if (output && typeof output === 'object') {
    if (output.text) return output.text.trim();
    if (output.content) return processOutput(output.content);
    if (output.summary) return processOutput(output.summary);
    if (output.message) return processOutput(output.message);
  }
  return String(output);
}

// 获取测验题库
async function apiGetQuiz() {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) return data.data;
    }
    console.warn('获取测验题库失败，使用本地mock数据');
  } catch (err) {
    console.error('获取测验题库错误：', err);
  }
  const mockResponse = await fetch('../../mock/dt.json');
  return await mockResponse.json();
}

// 获取随机测验题目
async function apiGetRandomQuiz() {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/random`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) return data.data;
    }
    console.warn('获取随机题目失败');
  } catch (err) {
    console.error('获取随机题目错误：', err);
  }
  return null;
}

// 检查测验答案
async function apiCheckQuizAnswer(quizId, userAnswer) {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ quizId, userAnswer })
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success) return data;
    }
    console.warn('检查答案失败');
  } catch (err) {
    console.error('检查答案错误：', err);
  }
  return { correct: false, correctAnswer: 0, explanation: '' };
}

// 获取地震新闻（优先从后端获取）
async function apiGetNews() {
  try {
    const response = await fetch(`${API_BASE_URL}/earthquake/news`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) return data.data;
    }
    console.warn('从后端获取新闻失败，尝试台网数据');
  } catch (err) {
    console.error('获取后端新闻数据失败:', err);
  }
  
  try {
    const cencData = await getLatestEarthquakes(10);
    if (cencData && cencData.length > 0) {
      return cencData;
    }
  } catch (err) {
    console.error('获取台网数据失败:', err);
  }
  
  const mockResponse = await fetch('../../mock/news.json');
  return await mockResponse.json();
}

// 获取最新地震数据（优先从后端获取）
async function apiGetEarthquakeData() {
  try {
    const response = await fetch(`${API_BASE_URL}/earthquake/latest`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) return data.data;
    }
    console.warn('从后端获取地震数据失败，尝试台网数据');
  } catch (err) {
    console.error('获取后端地震数据失败:', err);
  }
  
  try {
    const cencData = await getLatestEarthquakes(20);
    if (cencData && cencData.length > 0) {
      return cencData;
    }
  } catch (err) {
    console.error('获取台网数据失败:', err);
  }
  
  const mockResponse = await fetch('../../mock/news.json');
  return await mockResponse.json();
}

// 搜索地震数据
async function apiSearchEarthquake(filters) {
  try {
    const params = new URLSearchParams();
    if (filters.min_mag) params.append('min_mag', filters.min_mag);
    if (filters.max_mag) params.append('max_mag', filters.max_mag);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    
    const response = await fetch(`${API_BASE_URL}/earthquake/search?${params.toString()}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) return data.data;
    }
    console.warn('搜索地震数据失败');
  } catch (err) {
    console.error('搜索地震数据错误：', err);
  }
  return [];
}

// 获取应急信息
async function apiGetEmergencyInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/earthquake/emergency`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) return data.data;
    }
    console.warn('获取应急信息失败');
  } catch (err) {
    console.error('获取应急信息错误：', err);
  }
  return null;
}

// 暴露到全局
window.JiXiaoZhen = window.JiXiaoZhen || {};
window.JiXiaoZhen.API = {
  getAIAnswer: getAIAnswerRemote,
  getAIAnswerLocal: getAIAnswerLocal,
  apiGetQuiz: apiGetQuiz,
  apiGetRandomQuiz: apiGetRandomQuiz,
  apiCheckQuizAnswer: apiCheckQuizAnswer,
  apiGetNews: apiGetNews,
  apiGetEarthquakeData: apiGetEarthquakeData,
  apiSearchEarthquake: apiSearchEarthquake,
  apiGetEmergencyInfo: apiGetEmergencyInfo,
  getCencEarthquakeData: getCencEarthquakeData,
  getLatestEarthquakes: getLatestEarthquakes
};