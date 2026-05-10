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
  }

  async init() {
    // 获取DOM元素
    this.titleElement = document.getElementById('quiz-title');
    this.optionsElement = document.getElementById('quiz-options');
    this.resultElement = document.getElementById('quiz-result');
    this.scoreElement = document.getElementById('quiz-score');

    // 加载测验题目
    await this.loadQuestions();

    // 绑定开始按钮
    const startBtn = document.getElementById('startQuizBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.startQuiz());
    }

    console.log('✅ 测验模块初始化完成');
  }

  async loadQuestions() {
    if (window.JiXiaoZhen && window.JiXiaoZhen.API) {
      this.questions = await window.JiXiaoZhen.API.apiGetQuiz();
    } else {
      // 本地mock数据
      try {
        const response = await fetch('./mock/dt.json');
        this.questions = await response.json();
      } catch (err) {
        console.error('加载测验题目失败：', err);
        this.questions = [];
      }
    }
  }

  startQuiz() {
    this.current = 0;
    this.score = 0;
    this.renderQuiz();
  }

  renderQuiz() {
    if (!this.titleElement || !this.optionsElement) return;

    if (this.current >= this.questions.length) {
      this.titleElement.innerText = `测验完成！得分：${this.score}/${this.questions.length}`;
      this.optionsElement.innerHTML = '';
      if (this.resultElement) this.resultElement.innerHTML = '';
      this.optionsElement.innerHTML = `<button onclick="window.JiXiaoZhen.Quiz.startQuiz()" class="btn-primary">重新测验</button>`;
      return;
    }

    const q = this.questions[this.current];
    this.titleElement.innerText = (this.current + 1) + '. ' + q.title;
    this.optionsElement.innerHTML = q.options.map((opt, i) => 
      `<button onclick="window.JiXiaoZhen.Quiz.chooseAnswer(${i})" class="btn-secondary" style="margin-right:.5rem; margin-bottom:.5rem;">${opt}</button>`
    ).join('');

    if (this.scoreElement) {
      this.scoreElement.innerText = this.score;
    }
    if (this.resultElement) {
      this.resultElement.innerHTML = '';
    }
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