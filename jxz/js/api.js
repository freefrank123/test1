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
    depth: item.EPI_DEPTH ? `${item.EPI_DEPTH}km` : (item.depth ? `${item.depth}km` : (item.Depth ? `${item.Depth}km` : '未知')),
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

// 获取AI回答
async function getAIAnswerRemote(userText) {
  const API_KEY = '7554a6cf-11a3-4c57-bf86-373267397c66';
  const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/responses';
  const MODEL = 'doubao-seed-2-0-mini-260215';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: '你是【济小震地震应急助手】，只能回答地震避险、自救、求救、应急知识。回答必须：简短、安全、权威、可直接执行，不要多余话。直接给出最终答案，不要包含任何思考过程或中间步骤。' }]
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: userText }]
          }
        ]
      })
    });

    const data = await response.json();
    if (response.ok) {
      if (data.data && data.data[0] && data.data[0].output) {
        return processOutput(data.data[0].output);
      } else if (data.output) {
        return processOutput(data.output);
      }
      return 'AI响应格式异常';
    } else {
      return `API错误：${data.error?.message || '请求失败'}`;
    }
  } catch (err) {
    console.error('远程AI调用失败，使用本地数据');
    return getAIAnswerLocal(userText);
  }
}

// 本地AI回答（使用mock数据）
async function getAIAnswerLocal(userText) {
  try {
    const response = await fetch('../mock/chat.json');
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
    if (response.ok) return await response.json();
    console.warn('获取测验题库失败，使用本地mock数据');
  } catch (err) {
    console.error('获取测验题库错误：', err);
  }
  const mockResponse = await fetch('../mock/dt.json');
  return await mockResponse.json();
}

// 获取地震新闻（优先从台网获取）
async function apiGetNews() {
  try {
    // 优先从中国地震台网获取实时数据
    const cencData = await getLatestEarthquakes(10);
    if (cencData && cencData.length > 0) {
      return cencData;
    }
  } catch (err) {
    console.error('获取台网数据失败:', err);
  }
  
  // 备用：使用本地mock数据
  const mockResponse = await fetch('../mock/news.json');
  return await mockResponse.json();
}

// 获取历史地震数据（优先从台网获取）
async function apiGetEarthquakeData() {
  try {
    const cencData = await getLatestEarthquakes(20);
    if (cencData && cencData.length > 0) {
      return cencData;
    }
  } catch (err) {
    console.error('获取台网数据失败:', err);
  }
  
  // 备用：使用本地mock数据
  const mockResponse = await fetch('../mock/news.json');
  return await mockResponse.json();
}

// 暴露到全局
window.JiXiaoZhen = window.JiXiaoZhen || {};
window.JiXiaoZhen.API = {
  getAIAnswer: getAIAnswerRemote,
  getAIAnswerLocal: getAIAnswerLocal,
  apiGetQuiz: apiGetQuiz,
  apiGetNews: apiGetNews,
  apiGetEarthquakeData: apiGetEarthquakeData,
  getCencEarthquakeData: getCencEarthquakeData,
  getLatestEarthquakes: getLatestEarthquakes
};