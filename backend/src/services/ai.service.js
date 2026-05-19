require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class AIService {
  constructor() {
    this.apiKey = process.env.AI_API_KEY;
    this.apiUrl = process.env.AI_API_URL;
    this.model = process.env.AI_MODEL;
    this.systemPrompt = process.env.SYSTEM_PROMPT || '你是一个地震应急助手。';
  }

  async getAIAnswer(userText) {
    if (!userText || typeof userText !== 'string') {
      return { success: false, message: '输入内容不能为空' };
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
        return { 
          success: false, 
          message: data.error?.message || 'AI服务请求失败' 
        };
      }
    } catch (err) {
      console.error('AI服务调用异常:', err);
      return { 
        success: false, 
        message: 'AI服务暂时不可用，请稍后重试' 
      };
    }
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