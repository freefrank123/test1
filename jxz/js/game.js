// 济小震 · 游戏模块
class GameModule {
  constructor() {
    this.floorCount = 0;
    this.isShaking = false;
    this.canvas = null;
    this.scoreElement = null;
    this.buildBtn = null;
    this.earthquakeBtn = null;
  }

  init() {
    // 获取DOM元素
    this.canvas = document.getElementById('gameCanvas');
    this.scoreElement = document.getElementById('gameScore');

    // 绑定按钮事件
    const startBtn = document.getElementById('startGameBtn');
    const pauseBtn = document.getElementById('pauseGameBtn');
    const resetBtn = document.getElementById('resetGameBtn');

    if (startBtn) {
      startBtn.addEventListener('click', () => this.startGame());
    }
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.pauseGame());
    }
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetGame());
    }

    console.log('✅ 游戏模块初始化完成');
  }

  startGame() {
    this.floorCount = 0;
    this.isShaking = false;

    // 清空画布
    if (this.canvas) {
      this.canvas.innerHTML = '';
      
      // 添加提示
      const hint = document.createElement('p');
      hint.innerText = '点击下方按钮搭建房屋楼层';
      hint.style.opacity = '0.6';
      this.canvas.appendChild(hint);
    }

    // 更新得分显示
    if (this.scoreElement) {
      this.scoreElement.innerText = '楼层：0';
    }

    // 创建并显示控制按钮
    this.createControlButtons();
  }

  createControlButtons() {
    const buttonContainer = document.querySelector('.card div:last-of-type');
    if (!buttonContainer) return;

    // 移除已存在的按钮
    const existingBuildBtn = document.getElementById('game-build-btn');
    const existingEarthquakeBtn = document.getElementById('game-earthquake-btn');
    if (existingBuildBtn) existingBuildBtn.remove();
    if (existingEarthquakeBtn) existingEarthquakeBtn.remove();

    // 创建搭建按钮
    this.buildBtn = document.createElement('button');
    this.buildBtn.id = 'game-build-btn';
    this.buildBtn.className = 'btn-primary';
    this.buildBtn.innerHTML = '<i class="fas fa-building"></i> 搭建楼层';
    this.buildBtn.addEventListener('click', () => this.buildFloor());
    buttonContainer.appendChild(this.buildBtn);

    // 创建地震按钮
    this.earthquakeBtn = document.createElement('button');
    this.earthquakeBtn.id = 'game-earthquake-btn';
    this.earthquakeBtn.className = 'btn-secondary';
    this.earthquakeBtn.innerHTML = '<i class="fas fa-mountain"></i> 模拟地震';
    this.earthquakeBtn.addEventListener('click', () => this.simulateEarthquake());
    buttonContainer.appendChild(this.earthquakeBtn);
  }

  buildFloor() {
    if (this.isShaking || !this.canvas) return;

    this.floorCount++;

    // 移除提示
    const hint = this.canvas.querySelector('p');
    if (hint) hint.remove();

    // 创建楼层
    const floor = document.createElement('div');
    floor.className = 'game-floor';
    floor.style.width = `${Math.max(150 - this.floorCount * 15, 60)}px`;
    floor.style.height = '25px';
    floor.style.background = 'linear-gradient(135deg, #3498db, #2980b9)';
    floor.style.borderRadius = '4px';
    floor.style.marginBottom = '5px';
    floor.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';

    this.canvas.insertBefore(floor, this.canvas.firstChild);

    // 更新得分
    if (this.scoreElement) {
      this.scoreElement.innerText = `楼层：${this.floorCount}`;
    }
  }

  simulateEarthquake() {
    if (this.isShaking || !this.canvas) return;

    this.isShaking = true;
    this.canvas.classList.add('shaking');

    setTimeout(() => {
      this.canvas.classList.remove('shaking');
      this.isShaking = false;

      // 判断结果
      if (this.scoreElement) {
        if (this.floorCount >= 3) {
          this.scoreElement.innerText = `楼层：${this.floorCount} · 🏆 房屋稳固，抗震合格！`;
        } else if (this.floorCount >= 1) {
          this.scoreElement.innerText = `楼层：${this.floorCount} · ⚠️ 房屋不够稳固，继续搭建！`;
        } else {
          this.scoreElement.innerText = '请先搭建房屋！';
        }
      }
    }, 2000);
  }

  pauseGame() {
    // 暂停游戏逻辑
    console.log('游戏暂停');
  }

  resetGame() {
    this.floorCount = 0;
    this.isShaking = false;

    if (this.canvas) {
      this.canvas.innerHTML = `
        <i class="fas fa-dice-d6" style="font-size: 4.5rem; display:block; margin-bottom:1rem; opacity:.4;"></i>
        <p style="font-size:1.05rem;">游戏画布 — Canvas 动画与计分逻辑</p>
        <p style="font-size:.85rem;opacity:.5;">点击开始挑战</p>
      `;
    }

    if (this.scoreElement) {
      this.scoreElement.innerText = '得分：0';
    }

    // 移除控制按钮
    if (this.buildBtn) this.buildBtn.remove();
    if (this.earthquakeBtn) this.earthquakeBtn.remove();
  }
}

// 暴露到全局
window.JiXiaoZhen.Game = new GameModule();
window.JiXiaoZhen.initGame = () => window.JiXiaoZhen.Game.init();

// 添加游戏样式
if (!document.getElementById('game-styles')) {
  const styleEl = document.createElement('style');
  styleEl.id = 'game-styles';
  styleEl.textContent = `
    .shaking {
      animation: gameShake 0.5s ease-in-out infinite;
    }
    @keyframes gameShake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-8px); }
      75% { transform: translateX(8px); }
    }
  `;
  document.head.appendChild(styleEl);
}