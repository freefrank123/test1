// 济小震 · API接口模块
const API_BASE_URL = 'http://localhost:5000/api';

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
    const response = await fetch('./mock/chat.json');
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
  const mockResponse = await fetch('./mock/dt.json');
  return await mockResponse.json();
}

// 获取地震新闻
async function apiGetNews() {
  try {
    const response = await fetch(`${API_BASE_URL}/news`);
    if (response.ok) return await response.json();
    console.warn('获取地震新闻失败，使用本地mock数据');
  } catch (err) {
    console.error('获取地震新闻错误：', err);
  }
  const mockResponse = await fetch('./mock/news.json');
  return await mockResponse.json();
}

// 获取历史地震数据
async function apiGetEarthquakeData() {
  try {
    const response = await fetch(`${API_BASE_URL}/earthquake`);
    if (response.ok) return await response.json();
    console.warn('获取历史地震数据失败');
  } catch (err) {
    console.error('获取历史地震数据错误：', err);
  }
  const mockResponse = await fetch('./mock/news.json');
  return await mockResponse.json();
}

// 暴露到全局
window.JiXiaoZhen.API = {
  getAIAnswer: getAIAnswerRemote,
  getAIAnswerLocal: getAIAnswerLocal,
  apiGetQuiz: apiGetQuiz,
  apiGetNews: apiGetNews,
  apiGetEarthquakeData: apiGetEarthquakeData
};