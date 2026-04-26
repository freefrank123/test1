// 后端API基础URL
const API_BASE_URL = "http://localhost:5000/api";

// 获取AI回答
export async function getAIAnswer(userText) {
  // 替换为你实际的API密钥
  const API_KEY = "7554a6cf-11a3-4c57-bf86-373267397c66";
  // 火山引擎Ark平台API端点
  const API_URL = "https://ark.cn-beijing.volces.com/api/v3/responses";
  // 使用用户指定的模型
  const MODEL = "doubao-seed-2-0-mini-260215";

  // 处理不同类型的输出
  function processOutput(output) {
    if (typeof output === 'string') {
      return output.trim();
    } else if (Array.isArray(output)) {
      // 处理对象数组，提取文本内容
      return output.map(item => {
        if (typeof item === 'string') {
          return item;
        } else if (item && item.text) {
          return item.text;
        } else if (item && item.content) {
          // 处理包含content字段的对象
          return processOutput(item.content);
        } else if (item && typeof item === 'object') {
          // 递归处理嵌套对象
          return extractTextFromObject(item);
        } else {
          return String(item);
        }
      }).join(' ').trim();
    } else if (output && typeof output === 'object') {
      // 处理单个对象
      if (output.text) {
        return output.text.trim();
      } else if (output.content) {
        // 处理包含content字段的对象
        return processOutput(output.content);
      } else if (output.summary) {
        // 处理包含summary字段的对象
        return processOutput(output.summary);
      } else if (output.message) {
        // 处理包含message字段的对象
        return processOutput(output.message);
      } else {
        // 尝试从对象中提取文本
        return extractTextFromObject(output);
      }
    } else {
      return String(output);
    }
  }

  // 从对象中提取文本内容
  function extractTextFromObject(obj) {
    if (obj.content && (typeof obj.content === 'string' || Array.isArray(obj.content))) {
      return processOutput(obj.content);
    } else if (obj.text) {
      return obj.text.trim();
    } else if (obj.summary && Array.isArray(obj.summary)) {
      return obj.summary.map(item => {
        if (item.text) return item.text;
        return String(item);
      }).join(' ').trim();
    } else if (obj.message && obj.message.content) {
      return processOutput(obj.message.content);
    } else {
      // 如果无法提取文本，返回空字符串
      return '';
    }
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: "你是【济小震地震应急助手】，只能回答地震避险、自救、求救、应急知识。回答必须：简短、安全、权威、可直接执行，不要多余话。直接给出最终答案，不要包含任何思考过程或中间步骤。"
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: userText
              }
            ]
          }
        ]
      })
    });

    console.log("API响应状态：", response.status);
    
    const data = await response.json();
    console.log("API响应数据：", data);
    
    if (response.ok) {
      // 处理Ark平台API响应格式
      if (data.data && data.data[0] && data.data[0].output) {
        const output = data.data[0].output;
        return processOutput(output);
      } else if (data.output) {
        // 兼容其他可能的格式
        const output = data.output;
        return processOutput(output);
      } else {
        return "AI响应格式异常，请检查API配置。";
      }
    } else {
      return `API错误：${data.error?.message || data.msg || "请求失败"}`;
    }
  } catch (err) {
    console.error("API调用错误：", err);
    return `网络异常：${err.message || "请检查网络连接或API密钥"}`;
  }
}

// 获取测验题库
export async function apiGetQuiz() {
  try {
    const response = await fetch(`${API_BASE_URL}/quiz`);
    if (response.ok) {
      return await response.json();
    } else {
      // 失败时使用本地mock数据
      console.warn("获取测验题库失败，使用本地mock数据");
      const mockResponse = await fetch('./mock/dt.json');
      return await mockResponse.json();
    }
  } catch (err) {
    console.error("获取测验题库错误：", err);
    // 错误时使用本地mock数据
    const mockResponse = await fetch('./mock/dt.json');
    return await mockResponse.json();
  }
}

// 获取地震新闻
export async function apiGetNews() {
  try {
    const response = await fetch(`${API_BASE_URL}/news`);
    if (response.ok) {
      return await response.json();
    } else {
      // 失败时使用本地mock数据
      console.warn("获取地震新闻失败，使用本地mock数据");
      const mockResponse = await fetch('./mock/news.json');
      return await mockResponse.json();
    }
  } catch (err) {
    console.error("获取地震新闻错误：", err);
    // 错误时使用本地mock数据
    const mockResponse = await fetch('./mock/news.json');
    return await mockResponse.json();
  }
}

// 获取历史地震数据
export async function apiGetEarthquakeData() {
  try {
    const response = await fetch(`${API_BASE_URL}/earthquake`);
    if (response.ok) {
      return await response.json();
    } else {
      // 失败时返回空数组
      console.warn("获取历史地震数据失败");
      return [];
    }
  } catch (err) {
    console.error("获取历史地震数据错误：", err);
    return [];
  }
}