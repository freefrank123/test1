// 济小震 · 聊天模块
class ChatModule {
  constructor() {
    this.chatBox = null;
    this.inputBox = null;
    this.sendBtn = null;
  }

  init() {
    this.chatBox = document.getElementById('chatContainer') || document.getElementById('chat-box');
    this.inputBox = document.getElementById('chatInput') || document.getElementById('chat-input');
    this.sendBtn = document.getElementById('sendChatBtn');

    // 绑定事件
    if (this.sendBtn) {
      this.sendBtn.addEventListener('click', () => this.sendMsg());
    }
    if (this.inputBox) {
      this.inputBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMsg();
      });
    }

    console.log('✅ 聊天模块初始化完成');
  }

  async sendMsg() {
    if (!this.inputBox || !this.chatBox) return;

    const text = this.inputBox.value.trim();
    if (!text) return;

    // 显示用户消息
    this.addMsg(text, 'user');
    this.inputBox.value = '';

    // 检测是否需要联动地图（地震相关问题）
    const shouldSearchShelter = this.shouldSearchShelter(text);

    // 显示加载中
    this.addLoading();

    // 调用AI
    const aiReply = await this.getAIAnswer(text);

    // 移除加载，显示AI回答
    this.removeLoading();
    this.addMsg(aiReply, 'bot');

    // 如果是地震相关问题，自动搜索避难所
    if (shouldSearchShelter) {
      this.triggerShelterSearch();
    }
  }

  // 判断是否需要搜索避难所
  shouldSearchShelter(text) {
    const keywords = ['地震', '避难', '避险', '逃生', '安全', '救援'];
    return keywords.some(keyword => text.includes(keyword));
  }

  // 触发避难所搜索
  triggerShelterSearch() {
    if (window.JiXiaoZhen && window.JiXiaoZhen.Map) {
      // 检查是否有定位
      const hasLocation = window.JiXiaoZhen.Map.currentLocation;
      
      if (hasLocation) {
        // 已有定位，直接搜索
        if (window.JiXiaoZhen.Map.searchNearbyShelters) {
          window.JiXiaoZhen.Map.searchNearbyShelters();
        }
      } else {
        // 没有定位，先定位再搜索
        window.JiXiaoZhen.Map.getUserLocation();
        // 定位成功后自动搜索
        setTimeout(() => {
          if (window.JiXiaoZhen.Map.searchNearbyShelters) {
            window.JiXiaoZhen.Map.searchNearbyShelters();
          }
        }, 6000);
      }
    }
  }

  addMsg(text, role) {
    if (!this.chatBox) return;

    const div = document.createElement('div');
    div.className = `message ${role}`;

    if (role === 'user') {
      div.innerHTML = `<i class="fas fa-user" style="margin-right:.5rem;"></i>${text}`;
      div.style.textAlign = 'right';
      div.style.marginLeft = 'auto';
      div.style.background = '#3498db';
      div.style.color = 'white';
    } else {
      div.innerHTML = `<i class="fas fa-robot" style="margin-right:.5rem;"></i>${text}`;
      div.style.textAlign = 'left';
      div.style.background = 'white';
      div.style.border = '1px solid #ddd';
    }

    div.style.display = 'inline-block';
    div.style.maxWidth = '70%';
    div.style.padding = '.75rem 1rem';
    div.style.borderRadius = '1rem';
    div.style.marginBottom = '.5rem';

    this.chatBox.appendChild(div);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  }

  addLoading() {
    if (!this.chatBox) return;

    const loadDiv = document.createElement('div');
    loadDiv.id = 'loading';
    loadDiv.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right:.5rem;"></i>济小震思考中...';
    loadDiv.style.display = 'inline-block';
    loadDiv.style.padding = '.75rem 1rem';
    loadDiv.style.borderRadius = '1rem';
    loadDiv.style.background = 'white';
    loadDiv.style.border = '1px solid #ddd';
    loadDiv.style.color = '#666';

    this.chatBox.appendChild(loadDiv);
    this.chatBox.scrollTop = this.chatBox.scrollHeight;
  }

  removeLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
  }

  clearChat() {
    if (this.chatBox) {
      this.chatBox.innerHTML = '<div class="message bot"><i class="fas fa-robot" style="margin-right:.5rem;"></i>你好，我是济小震AI助手。地震发生时我应该怎么做？请随时向我提问。</div>';
    }
  }

  async getAIAnswer(userText) {
    // 优先调用远程AI API
    if (window.JiXiaoZhen && window.JiXiaoZhen.API) {
      try {
        const result = await window.JiXiaoZhen.API.getAIAnswer(userText);
        // 如果返回了有效回答（不是错误信息），则返回
        if (result && !result.includes('错误') && !result.includes('失败')) {
          return result;
        }
      } catch (err) {
        console.error('远程AI调用失败:', err);
      }
    }

    // 回退到本地mock数据
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
      console.error('本地mock数据加载失败:', err);
      return '抱歉，暂时无法回答你的问题';
    }
  }
}

// 暴露到全局
window.JiXiaoZhen.Chat = new ChatModule();
window.JiXiaoZhen.initChat = () => window.JiXiaoZhen.Chat.init();
window.sendChatMsg = () => window.JiXiaoZhen.Chat.sendMsg();
window.clearChat = () => window.JiXiaoZhen.Chat.clearChat();