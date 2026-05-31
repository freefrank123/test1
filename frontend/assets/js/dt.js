// 济小震 · 测验模块
class QuizModule {
  constructor() {
    this.questions = [];
    this.current = 0;
    this.score = 0;
    this.titleElement = null;
    this.optionsElement = null;
    this.resultElement = null;
    this.scoreElement = null;
    this.startBtn = null;
  }

  async init() {
    // 获取DOM元素
    this.titleElement = document.getElementById('quiz-title');
    this.optionsElement = document.getElementById('quiz-options');
    this.resultElement = document.getElementById('quiz-result');
    this.scoreElement = document.getElementById('quiz-score');
    this.startBtn = document.getElementById('startQuizBtn');

    // 加载测验题目
    await this.loadQuestions();

    // 绑定开始按钮
    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => this.startQuiz());
    }

    console.log('✅ 测验模块初始化完成');
  }

  async loadQuestions() {
    let questions = [];
    if (window.JiXiaoZhen && window.JiXiaoZhen.API) {
      questions = await window.JiXiaoZhen.API.apiGetQuiz();
    } else {
      // 本地mock数据
      try {
        const response = await fetch('../../mock/dt.json');
        questions = await response.json();
      } catch (err) {
        console.error('加载测验题目失败：', err);
        questions = [];
      }
    }
    
    // 随机打乱每个题目的选项顺序
    this.questions = questions.map(q => {
      const { options, answer, ...rest } = q;
      const shuffled = this.shuffleArray(options.slice());
      const newAnswer = shuffled.indexOf(options[answer]);
      return {
        ...rest,
        options: shuffled,
        answer: newAnswer,
        originalAnswer: answer // 保留原始答案索引用于统计
      };
    });
  }
  
  // Fisher-Yates 洗牌算法
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  startQuiz() {
    this.current = 0;
    this.score = 0;
    // 隐藏开始按钮
    if (this.startBtn) {
      this.startBtn.style.display = 'none';
    }
    this.renderQuiz();
  }

  renderQuiz() {
    if (!this.titleElement || !this.optionsElement) return;

    if (this.current >= this.questions.length) {
      const totalScore = this.score * 10;
      const correctCount = this.score;
      const totalCount = this.questions.length;
      
      // 显示结果弹窗
      this.showResultModal(totalScore, correctCount, totalCount);
      
      // 保存测试积分（登录用户）
      if (window.JiXiaoZhen?.User) {
        window.JiXiaoZhen.User.saveTestScore(totalScore, totalCount);
      }
      return;
    }

    const q = this.questions[this.current];
    this.titleElement.innerText = `第 ${this.current + 1} 题：${q.title}`;
    this.optionsElement.innerHTML = q.options.map((opt, i) => 
      `<button onclick="window.JiXiaoZhen.Quiz.chooseAnswer(${i})" class="btn-secondary" style="margin-right:.5rem; margin-bottom:.5rem;">${opt}</button>`
    ).join('');

    if (this.scoreElement) {
      this.scoreElement.innerText = this.score * 10;
    }
    if (this.resultElement) {
      this.resultElement.innerHTML = '';
    }
  }
  
  // 显示结果弹窗
  showResultModal(totalScore, correctCount, totalCount) {
    // 移除已存在的弹窗
    const existingModal = document.getElementById('quiz-result-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // 计算正确率
    const accuracy = Math.round((correctCount / totalCount) * 100);
    
    // 根据得分选择不同的显示内容
    let icon, title, message, bgColor;
    
    if (accuracy === 100) {
      icon = 'fas fa-thumbs-up';
      title = '🎉 完美！';
      message = '你真棒，全做对了！';
      bgColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    } else if (accuracy >= 80) {
      icon = 'fas fa-star';
      title = '👏 优秀！';
      message = `太棒了！答对了${correctCount}题，继续保持！`;
      bgColor = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    } else if (accuracy >= 60) {
      icon = 'fas fa-smile';
      title = '😊 不错！';
      message = `答对了${correctCount}题，继续努力！`;
      bgColor = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    } else {
      icon = 'fas fa-book-open';
      title = '📚 加油！';
      message = `答对了${correctCount}题，多学习知识再来挑战吧！`;
      bgColor = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
    }
    
    // 创建弹窗
    const modal = document.createElement('div');
    modal.id = 'quiz-result-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.6);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
      <div style="
        background: ${bgColor};
        border-radius: 20px;
        padding: 3rem;
        text-align: center;
        color: white;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        animation: slideUp 0.4s ease;
      ">
        <div style="font-size: 6rem; margin-bottom: 1rem;">
          <i class="${icon}"></i>
        </div>
        <h2 style="font-size: 2rem; margin-bottom: 1rem;">${title}</h2>
        <p style="font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9;">${message}</p>
        <div style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
          <div style="font-size: 3rem; font-weight: bold;">${totalScore}<span style="font-size: 1.5rem;">分</span></div>
          <div style="opacity: 0.8; margin-top: 0.5rem;">正确率：${accuracy}%（${correctCount}/${totalCount}题）</div>
        </div>
        <button onclick="window.JiXiaoZhen.Quiz.closeModalAndRestart()" style="
          background: white;
          color: #333;
          border: none;
          padding: 1rem 3rem;
          border-radius: 30px;
          font-size: 1.1rem;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          再测一次
        </button>
      </div>
      <style>
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      </style>
    `;
    
    document.body.appendChild(modal);
    
    // 点击背景关闭弹窗
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });
  }
  
  // 关闭弹窗
  closeModal() {
    const modal = document.getElementById('quiz-result-modal');
    if (modal) {
      modal.remove();
    }
  }
  
  // 关闭弹窗并重新开始
  closeModalAndRestart() {
    this.closeModal();
    this.startQuiz();
  }

  chooseAnswer(index) {
    const q = this.questions[this.current];
    const isCorrect = q.answer === index;

    if (isCorrect) this.score++;

    // 显示答案结果
    if (this.resultElement) {
      const correctAnswer = q.options[q.answer];
      this.resultElement.innerHTML = `
        <div style="margin-top:10px; padding:10px; border-radius:8px; ${isCorrect ? 'background:#d4edda; color:#155724;' : 'background:#f8d7da; color:#721c24;'}">
          ${isCorrect ? '✓ 回答正确！' : '✗ 回答错误！'}<br>
          正确答案：${correctAnswer}
        </div>
      `;
    }

    // 延迟进入下一题
    setTimeout(() => {
      this.current++;
      this.renderQuiz();
    }, 1500);
  }
}

// 暴露到全局
window.JiXiaoZhen.Quiz = new QuizModule();
window.JiXiaoZhen.initQuiz = () => window.JiXiaoZhen.Quiz.init();