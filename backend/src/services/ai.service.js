require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class AIService {
  constructor() {
    require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
    this.apiKey = process.env.AI_API_KEY;
    this.apiUrl = process.env.AI_API_URL;
    this.model = process.env.AI_MODEL;
    this.systemPrompt = process.env.SYSTEM_PROMPT || '你是一个地震应急助手。';
    this.useMockData = process.env.USE_MOCK_DATA === 'true';
    console.log('AI服务初始化 - API_KEY:', this.apiKey ? '已配置' : '未配置');
    console.log('AI服务初始化 - API_URL:', this.apiUrl);
    console.log('AI服务初始化 - USE_MOCK_DATA:', this.useMockData);
    
    this.mockAnswers = {
      '地震': '地震是地球内部能量释放引起的地面震动。主要成因是板块运动或断层错动。',
      '什么是地震': '地震是地球内部能量突然释放导致的地面震动现象，是一种自然地质灾害。',
      '震级': '震级是衡量地震释放能量大小的指标，常用里氏震级表示。',
      '烈度': '烈度是描述地震对地表及建筑物破坏程度的指标，同一地震不同地区烈度不同。',
      '逃生': '地震发生时应迅速躲到坚固家具下或承重墙墙角，远离窗户和危险物品。',
      '自救': '若被掩埋，保持冷静，用敲击方式发出求救信号，保存体力等待救援。',
      '急救': '检查伤员呼吸和心跳，止血包扎，优先处理危及生命的伤害。',
      '应急包': '应急包应包含水、食物、急救药品、手电筒、收音机等必需品。',
      '避震': '在室内躲在承重墙墙角或坚固家具旁，在室外远离建筑物和电线。',
      '余震': '主震后可能发生多次余震，应继续保持警惕，避免返回危险建筑。',
      '海啸': '近海强震可能引发海啸，沿海居民应向高处撤离。',
      '防范': '定期进行地震演练，检查房屋结构，准备应急物资。'
    };
  }

  async getAIAnswer(userText) {
    if (!userText || typeof userText !== 'string') {
      return { success: false, message: '输入内容不能为空' };
    }

    if (this.useMockData || !this.apiKey || this.apiKey === 'your_api_key_here') {
      return this.getMockAnswer(userText);
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          input: [
            {
              role: 'system',
              content: [{ type: 'input_text', text: this.systemPrompt }]
            },
            {
              role: 'user',
              content: [{ type: 'input_text', text: userText }]
            }
          ]
        })
      });

      const data = await response.json();
      console.log('AI API响应:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        const answer = this.processOutput(data);
        return { success: true, answer };
      } else {
        console.warn('AI API失败，使用mock数据');
        return this.getMockAnswer(userText);
      }
    } catch (err) {
      console.warn('AI服务调用异常，使用mock数据:', err.message);
      return this.getMockAnswer(userText);
    }
  }

  getMockAnswer(userText) {
    for (const [keyword, answer] of Object.entries(this.mockAnswers)) {
      if (userText.includes(keyword)) {
        return { success: true, answer };
      }
    }
    return { 
      success: true, 
      answer: '我是济小震地震应急助手，专注于地震避险、自救、求救和应急知识。你可以问我关于地震成因、震级烈度、避震技巧、急救措施等方面的问题。' 
    };
  }

  processOutput(data) {
    if (!data) return 'AI响应为空';
    
    if (data.data && data.data[0] && data.data[0].output) {
      return this.extractText(data.data[0].output);
    } else if (data.output && Array.isArray(data.output)) {
      const messageItem = data.output.find(item => item.type === 'message' && item.role === 'assistant');
      if (messageItem && messageItem.content) {
        return this.extractText(messageItem.content);
      }
      return this.extractText(data.output);
    } else if (data.output) {
      return this.extractText(data.output);
    }
    
    return 'AI响应格式异常';
  }

  extractText(output) {
    if (typeof output === 'string') return output.trim();
    
    if (Array.isArray(output)) {
      return output.map(item => {
        if (typeof item === 'string') return item;
        if (item?.text) return item.text;
        if (item?.content) return this.extractText(item.content);
        return String(item);
      }).join(' ').trim();
    }
    
    if (output && typeof output === 'object') {
      if (output.text) return output.text.trim();
      if (output.content) return this.extractText(output.content);
      if (output.summary) return this.extractText(output.summary);
      if (output.message) return this.extractText(output.message);
    }
    
    return String(output);
  }
}

module.exports = new AIService();