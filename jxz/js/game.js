// 济小震 · 游戏模块（优化版）
class GameModule {
  constructor() {
    this.floorCount = 0;
    this.foundationLevel = 0;
    this.reinforcedFloors = new Set();
    this.score = 0;
    this.isShaking = false;
    this.canvas = null;
    this.scoreElement = null;
    this.buildBtn = null;
    this.earthquakeBtn = null;
    this.foundationBtn = null;
    this.reinforceBtn = null;
    this.difficulty = 'medium'; // easy, medium, hard
    this.warnedAboutHeight = false; // 记录是否已提醒过楼层过高警告
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
    this.foundationLevel = 0;
    this.reinforcedFloors = new Set();
    this.score = 0;
    this.isShaking = false;
    this.difficulty = 'medium';
    this.warnedAboutHeight = false; // 重置警告标志

    // 清空画布
    if (this.canvas) {
      this.canvas.innerHTML = '';
      this.canvas.style.borderBottom = '3px solid #3498db';
      this.canvas.style.maxHeight = '400px';
      this.canvas.style.overflowY = 'auto';
      this.canvas.style.overflowX = 'hidden';
      this.canvas.style.scrollBehavior = 'smooth';
      this.canvas.style.display = 'block';
      
      // 添加提示
      const hint = document.createElement('p');
      hint.innerText = '🏗️ 先打地基，再建高楼！';
      hint.style.opacity = '0.6';
      hint.style.marginBottom = '20px';
      hint.style.textAlign = 'center';
      this.canvas.appendChild(hint);
    }

    // 更新得分显示
    this.updateScore();

    // 创建并显示控制按钮
    this.createControlButtons();
  }

  createControlButtons() {
    // 找到按钮区域（包含startGameBtn的div）
    const startBtn = document.getElementById('startGameBtn');
    const buttonContainer = startBtn ? startBtn.parentElement : document.querySelector('.card div:nth-of-type(2)');
    if (!buttonContainer) return;

    // 只在首次创建时添加按钮
    if (document.getElementById('game-foundation-btn')) {
      // 按钮已存在，更新状态即可
      this.updateButtonStates();
      return;
    }

    // 创建难度选择
    const difficultyDiv = document.createElement('div');
    difficultyDiv.id = 'game-difficulty-select';
    difficultyDiv.style.marginBottom = '1rem';
    difficultyDiv.innerHTML = `
      <div style="display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap;">
        <button onclick="JiXiaoZhen.Game.setDifficulty('easy')" class="btn-secondary" style="padding: 4px 12px; font-size: 12px;">🌊 弱震</button>
        <button onclick="JiXiaoZhen.Game.setDifficulty('medium')" class="btn-primary" style="padding: 4px 12px; font-size: 12px;">🌪️ 中震</button>
        <button onclick="JiXiaoZhen.Game.setDifficulty('hard')" class="btn-secondary" style="padding: 4px 12px; font-size: 12px;">🔥 强震</button>
      </div>
    `;
    buttonContainer.appendChild(difficultyDiv);

    // 创建地基按钮
    this.foundationBtn = document.createElement('button');
    this.foundationBtn.id = 'game-foundation-btn';
    this.foundationBtn.className = 'btn-primary';
    this.foundationBtn.innerHTML = '<i class="fas fa-mountain"></i> 打地基 (+5分)';
    this.foundationBtn.addEventListener('click', () => this.buildFoundation());
    buttonContainer.appendChild(this.foundationBtn);

    // 创建搭建按钮
    this.buildBtn = document.createElement('button');
    this.buildBtn.id = 'game-build-btn';
    this.buildBtn.className = 'btn-secondary';
    this.buildBtn.innerHTML = '<i class="fas fa-building"></i> 搭建楼层 (+10分)';
    this.buildBtn.addEventListener('click', () => this.buildFloor());
    buttonContainer.appendChild(this.buildBtn);

    // 创建加固按钮
    this.reinforceBtn = document.createElement('button');
    this.reinforceBtn.id = 'game-reinforce-btn';
    this.reinforceBtn.className = 'btn-secondary';
    this.reinforceBtn.innerHTML = '<i class="fas fa-shield-alt"></i> 加固楼层 (-15分)';
    this.reinforceBtn.addEventListener('click', () => this.reinforceFloor());
    buttonContainer.appendChild(this.reinforceBtn);

    // 创建地震按钮
    this.earthquakeBtn = document.createElement('button');
    this.earthquakeBtn.id = 'game-earthquake-btn';
    this.earthquakeBtn.className = 'btn-primary';
    this.earthquakeBtn.innerHTML = '<i class="fas fa-mountain"></i> 模拟地震';
    this.earthquakeBtn.addEventListener('click', () => this.simulateEarthquake());
    buttonContainer.appendChild(this.earthquakeBtn);
  }

  // 更新按钮状态（禁用/启用）
  updateButtonStates() {
    if (this.foundationBtn) {
      this.foundationBtn.disabled = this.foundationLevel >= 3 || this.isShaking;
      this.foundationBtn.innerHTML = this.foundationLevel >= 3 
        ? '<i class="fas fa-mountain"></i> 地基已满' 
        : '<i class="fas fa-mountain"></i> 打地基 (+5分)';
    }
    
    if (this.buildBtn) {
      this.buildBtn.disabled = this.foundationLevel === 0 || this.isShaking;
      this.buildBtn.innerHTML = this.foundationLevel === 0 
        ? '<i class="fas fa-building"></i> 先打地基' 
        : '<i class="fas fa-building"></i> 搭建楼层 (+10分)';
    }
    
    if (this.reinforceBtn) {
      this.reinforceBtn.disabled = this.floorCount === 0 || this.score < 15 || this.isShaking;
      this.reinforceBtn.innerHTML = this.floorCount === 0 
        ? '<i class="fas fa-shield-alt"></i> 先建楼层' 
        : this.score < 15 
          ? '<i class="fas fa-shield-alt"></i> 积分不足' 
          : '<i class="fas fa-shield-alt"></i> 加固楼层 (-15分)';
    }
    
    if (this.earthquakeBtn) {
      this.earthquakeBtn.disabled = this.floorCount === 0 || this.isShaking;
      this.earthquakeBtn.innerHTML = this.floorCount === 0 
        ? '<i class="fas fa-mountain"></i> 先建房屋' 
        : this.isShaking 
          ? '<i class="fas fa-mountain"></i> 地震中...' 
          : '<i class="fas fa-mountain"></i> 模拟地震';
    }
  }

  setDifficulty(level) {
    this.difficulty = level;
    
    // 更新按钮样式
    const buttons = document.querySelectorAll('#game-difficulty-select button');
    buttons.forEach(btn => {
      btn.className = btn.textContent.includes(this.getDifficultyLabel()) ? 'btn-primary' : 'btn-secondary';
    });
  }

  getDifficultyLabel() {
    const labels = { easy: '弱震', medium: '中震', hard: '强震' };
    return labels[this.difficulty] || '中震';
  }

  getDifficultyMultiplier() {
    const multipliers = { easy: 0.5, medium: 1, hard: 1.5 };
    return multipliers[this.difficulty] || 1;
  }

  buildFoundation() {
    if (this.isShaking || !this.canvas) return;
    if (this.foundationLevel >= 3) {
      alert('地基已达到最高等级！');
      return;
    }

    this.foundationLevel++;
    this.score += 5;

    // 移除提示
    const hint = this.canvas.querySelector('p');
    if (hint) hint.remove();

    // 创建地基层
    const foundation = document.createElement('div');
    foundation.className = 'game-foundation';
    foundation.style.width = `${200 + this.foundationLevel * 30}px`;
    foundation.style.height = '30px';
    foundation.style.background = `linear-gradient(135deg, #667eea ${this.foundationLevel * 30}%, #764ba2 ${100 - this.foundationLevel * 20}%)`;
    foundation.style.borderRadius = '8px 8px 0 0';
    foundation.style.marginBottom = '0';
    foundation.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    foundation.innerHTML = `<span style="font-size: 10px; color: white; padding: 5px;">地基 Lv.${this.foundationLevel}</span>`;
    foundation.style.display = 'flex';
    foundation.style.alignItems = 'center';
    foundation.style.justifyContent = 'center';
    foundation.style.marginTop = '4px';
    foundation.style.position = 'relative';
    foundation.style.left = '50%';
    foundation.style.marginLeft = `-${(200 + this.foundationLevel * 30) / 2}px`;

    // 如果已有地基，替换它
    const existingFoundation = this.canvas.querySelector('.game-foundation');
    if (existingFoundation) {
      this.canvas.replaceChild(foundation, existingFoundation);
    } else {
      // 添加到画布末尾（底部）
      this.canvas.appendChild(foundation);
    }

    // 更新得分
    this.updateScore();
    // 更新按钮状态
    this.updateButtonStates();
  }

  buildFloor() {
    if (this.isShaking || !this.canvas) return;
    if (this.foundationLevel === 0) {
      alert('请先打好地基再建楼！');
      return;
    }

    this.floorCount++;

    // 楼层过高警告（只提醒一次）
    if (this.floorCount === 21 && !this.warnedAboutHeight) {
      alert('⚠️ 楼层过高会大幅增加地震风险！建议不超过20层');
      this.warnedAboutHeight = true;
    }
    this.score += 10;

    // 移除提示
    const hint = this.canvas.querySelector('p');
    if (hint) hint.remove();

    // 创建楼层
    const floor = document.createElement('div');
    floor.className = 'game-floor';
    floor.dataset.floor = this.floorCount;
    const maxWidth = 200 + this.foundationLevel * 30;
    const floorWidth = Math.max(maxWidth - this.floorCount * 10, 80);
    floor.style.width = `${floorWidth}px`;
    floor.style.height = '28px';
    floor.style.background = this.getFloorColor(this.floorCount);
    floor.style.borderRadius = '4px';
    floor.style.margin = '0 auto 4px';
    floor.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    floor.style.display = 'flex';
    floor.style.alignItems = 'center';
    floor.style.justifyContent = 'center';
    floor.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    floor.style.transform = `scale(0.7) translateY(-20px)`;
    floor.style.opacity = '0';
    floor.style.transformOrigin = 'center bottom';
    floor.innerHTML = `<span style="font-size: 10px; color: white; font-weight: bold;">${this.floorCount}F</span>`;

    // 插入到最顶部（后建的楼层在上面）
    const firstFloor = this.canvas.querySelector('.game-floor');
    if (firstFloor) {
      // 如果已有楼层，插入到最顶层之前
      this.canvas.insertBefore(floor, firstFloor);
    } else {
      // 如果没有楼层，插入到地基之前
      const foundation = this.canvas.querySelector('.game-foundation');
      if (foundation) {
        this.canvas.insertBefore(floor, foundation);
      } else {
        this.canvas.appendChild(floor);
      }
    }

    // 触发入场动画
    requestAnimationFrame(() => {
      floor.style.transform = 'scale(1) translateY(0)';
      floor.style.opacity = '1';
    });

    // 更新得分
    this.updateScore();
    // 更新按钮状态
    this.updateButtonStates();
  }

  reinforceFloor() {
    if (this.isShaking || !this.canvas || this.floorCount === 0) return;
    if (this.score < 15) {
      alert('积分不足！需要15分加固一层');
      return;
    }

    // 从下往上加固（找到最底层未加固的楼层）
    const floors = this.canvas.querySelectorAll('.game-floor:not(.reinforced)');
    if (floors.length === 0) {
      alert('所有楼层都已加固！');
      return;
    }
    
    // 获取最底层的未加固楼层（最后一个元素）
    const bottomFloor = floors[floors.length - 1];

    this.score -= 15;
    this.reinforcedFloors.add(parseInt(bottomFloor.dataset.floor));
    bottomFloor.classList.add('reinforced');
    bottomFloor.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    bottomFloor.innerHTML = `<span style="font-size: 10px; color: white; font-weight: bold;">${bottomFloor.dataset.floor}F ✨</span>`;

    this.updateScore();
    // 更新按钮状态
    this.updateButtonStates();
  }

  getFloorColor(floorNum) {
    const colors = [
      'linear-gradient(135deg, #3498db, #2980b9)',
      'linear-gradient(135deg, #9b59b6, #8e44ad)',
      'linear-gradient(135deg, #34495e, #2c3e50)',
      'linear-gradient(135deg, #e74c3c, #c0392b)',
      'linear-gradient(135deg, #f39c12, #d68910)'
    ];
    return colors[(floorNum - 1) % colors.length];
  }

  simulateEarthquake() {
    if (this.isShaking || !this.canvas) return;
    if (this.floorCount === 0) {
      alert('请先建造房屋！');
      return;
    }

    this.isShaking = true;
    const intensity = this.getDifficultyMultiplier();
    
    // 更新按钮状态（禁用所有按钮）
    this.updateButtonStates();

    // 应用震动效果
    this.canvas.classList.add('shaking');
    this.canvas.style.setProperty('--shake-intensity', `${8 * intensity}px`);

    // 根据难度设置震动时间
    const shakeDuration = 2000 * intensity;

    setTimeout(() => {
      this.canvas.classList.remove('shaking');
      this.isShaking = false;

      // 判断结果
      this.evaluateResult();
      
      // 地震结束后更新按钮状态
      this.updateButtonStates();
    }, shakeDuration);
  }

  evaluateResult() {
    const intensity = this.getDifficultyMultiplier();
    
    // 地基提供基础稳定性，等级越高效果越好
    const foundationBonus = this.foundationLevel * 35;
    
    // 楼层提供少量强度，但也增加风险
    const floorStrength = this.floorCount * 6;
    
    // 加固提供额外保护
    const reinforceBonus = this.reinforcedFloors.size * 18;
    
    // 总强度
    const totalStrength = foundationBonus + floorStrength + reinforceBonus;
    
    // 高度惩罚：楼层越高，风险呈指数增长
    // 5层以下基本安全，超过5层后风险快速增加
    const heightPenalty = this.floorCount <= 5 ? 1 : Math.pow(1.15, this.floorCount - 5);
    
    // 地基可以降低高度惩罚的影响
    const foundationProtection = 1 - (this.foundationLevel * 0.1);
    
    // 最终损伤阈值（考虑高度风险和地基保护）
    const baseThreshold = this.floorCount * 12 * intensity;
    const actualHeightPenalty = Math.max(1, heightPenalty * foundationProtection);
    const damageThreshold = baseThreshold * actualHeightPenalty;

    let result = '';
    let emoji = '';
    let bonusScore = 0;
    let damageLevel = 'none';

    if (totalStrength >= damageThreshold * 1.5) {
      emoji = '🏆';
      result = '房屋稳固，完美抗震！';
      bonusScore = 50;
      damageLevel = 'none';
    } else if (totalStrength >= damageThreshold) {
      emoji = '👍';
      result = '房屋稳固，抗震合格！';
      bonusScore = 20;
      damageLevel = 'none';
    } else if (totalStrength >= damageThreshold * 0.8) {
      emoji = '⚠️';
      result = '房屋轻微受损，需要加固！';
      bonusScore = 0;
      damageLevel = 'light';
    } else if (totalStrength >= damageThreshold * 0.5) {
      emoji = '🛠️';
      result = '房屋中度受损，部分楼层需要修复！';
      bonusScore = -15;
      damageLevel = 'medium';
    } else if (totalStrength >= damageThreshold * 0.25) {
      emoji = '🔥';
      result = '房屋重度损毁，需要大规模修复！';
      bonusScore = -30;
      damageLevel = 'heavy';
    } else {
      emoji = '💥';
      result = '房屋倒塌！';
      bonusScore = -50;
      damageLevel = 'collapsed';
    }

    this.score += bonusScore;
    this.updateScore();

    // 应用损伤视觉效果（传入结果数据以便倒塌时延迟显示）
    this.applyDamageEffect(damageLevel, { emoji, result, bonusScore });
  }

  applyDamageEffect(damageLevel, resultData = null) {
    const floors = this.canvas.querySelectorAll('.game-floor');
    if (floors.length === 0) {
      if (damageLevel !== 'none' && resultData) {
        this.showResultModal(resultData.emoji, resultData.result, resultData.bonusScore);
      }
      return;
    }

    const floorArray = Array.from(floors);
    
    switch (damageLevel) {
      case 'light': {
        // 轻微受损：随机几层变色
        const numDamaged = Math.ceil(floorArray.length * 0.2);
        const shuffled = [...floorArray].sort(() => Math.random() - 0.5);
        shuffled.slice(0, numDamaged).forEach(floor => {
          floor.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
          floor.style.transform = 'skewX(-2deg)';
        });
        if (resultData) {
          this.showResultModal(resultData.emoji, resultData.result, resultData.bonusScore);
        }
        break;
      }
      case 'medium': {
        // 中度受损：一半楼层变色并倾斜
        const numDamaged = Math.ceil(floorArray.length * 0.5);
        const shuffled = [...floorArray].sort(() => Math.random() - 0.5);
        shuffled.slice(0, numDamaged).forEach((floor, index) => {
          floor.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
          floor.style.transform = `skewX(${index % 2 === 0 ? -3 : 3}deg)`;
        });
        if (resultData) {
          this.showResultModal(resultData.emoji, resultData.result, resultData.bonusScore);
        }
        break;
      }
      case 'heavy': {
        // 重度损毁：大部分楼层严重变形
        floorArray.forEach((floor, index) => {
          if (index < floorArray.length * 0.7) {
            floor.style.background = 'linear-gradient(135deg, #991b1b, #7f1d1d)';
            floor.style.transform = `skewX(${index % 2 === 0 ? -8 : 8}deg) scale(0.95)`;
            floor.style.opacity = '0.7';
          }
        });
        // 移除顶部几层
        for (let i = 0; i < Math.ceil(floorArray.length * 0.3); i++) {
          if (floorArray[i]) {
            floorArray[i].style.display = 'none';
            this.floorCount--;
          }
        }
        if (resultData) {
          this.showResultModal(resultData.emoji, resultData.result, resultData.bonusScore);
        }
        break;
      }
      case 'collapsed': {
        // 倒塌：所有楼层倒塌动画
        floorArray.forEach((floor, index) => {
          floor.style.transition = `transform 0.6s ease-in-out ${index * 0.08}s, opacity 0.4s ease-out ${index * 0.08}s`;
          floor.style.transform = `translateY(${100 + index * 50}px) rotate(${index % 2 === 0 ? -45 : 45}deg) scale(0.7)`;
          floor.style.opacity = '0';
          floor.style.zIndex = -index;
        });
        // 延迟后移除楼层并显示结算弹窗
        setTimeout(() => {
          floorArray.forEach(floor => {
            floor.remove();
          });
          this.floorCount = 0;
          this.reinforcedFloors.clear();
          
          // 倒塌动画结束后显示结算弹窗
          if (resultData) {
            this.showResultModal(resultData.emoji, resultData.result, resultData.bonusScore);
          }
        }, 1000);
        break;
      }
      default: {
        if (resultData) {
          this.showResultModal(resultData.emoji, resultData.result, resultData.bonusScore);
        }
      }
    }
  }

  showResultModal(emoji, message, bonus) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      z-index: 1000;
      text-align: center;
      min-width: 280px;
    `;

    const bonusText = bonus > 0 ? `+${bonus}分` : bonus < 0 ? `${bonus}分` : '';

    modal.innerHTML = `
      <div style="font-size: 5rem; margin-bottom: 1rem;">${emoji}</div>
      <h3 style="color: #333; margin-bottom: 1rem;">${message}</h3>
      <p style="color: #666; font-size: 14px;">地基等级：${this.foundationLevel}级</p>
      <p style="color: #666; font-size: 14px;">楼层数量：${this.floorCount}层</p>
      <p style="color: #666; font-size: 14px;">加固楼层：${this.reinforcedFloors.size}层</p>
      ${bonusText ? `<p style="color: ${bonus > 0 ? '#10b981' : '#ef4444'}; font-weight: bold; margin-top: 1rem;">${bonusText}</p>` : ''}
      <button onclick="document.body.removeChild(this.parentElement); document.body.removeChild(document.querySelector('.modal-overlay'))" 
        style="margin-top: 1.5rem; padding: 10px 30px; background: linear-gradient(135deg, #3b6df0, #7c3aed); color: white; border: none; border-radius: 8px; cursor: pointer;">
        继续游戏
      </button>
    `;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 999;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
  }

  updateScore() {
    if (this.scoreElement) {
      this.scoreElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; padding: 0.5rem; background: #f8f9fa; border-radius: 8px;">
          <span style="color: #333;">🏆 积分：${this.score}</span>
          <span style="color: #666; font-size: 12px;">难度：${this.getDifficultyLabel()}</span>
        </div>
      `;
    }
  }

  pauseGame() {
    if (this.isShaking) {
      this.canvas.classList.remove('shaking');
      this.isShaking = false;
      this.earthquakeBtn.innerHTML = '<i class="fas fa-mountain"></i> 模拟地震';
      alert('地震已暂停');
    } else {
      alert('游戏已暂停，点击"模拟地震"继续');
    }
  }

  resetGame() {
    this.floorCount = 0;
    this.foundationLevel = 0;
    this.reinforcedFloors = new Set();
    this.score = 0;
    this.isShaking = false;

    if (this.canvas) {
      this.canvas.innerHTML = `
        <i class="fas fa-dice-d6" style="font-size: 4.5rem; display:block; margin-bottom:1rem; opacity:.4;"></i>
        <p style="font-size:1.05rem;">游戏画布 — Canvas 动画与计分逻辑</p>
        <p style="font-size:.85rem;opacity:.5;">点击开始挑战</p>
      `;
      this.canvas.style.borderBottom = '3px solid #3498db';
    }

    this.updateScore();

    // 移除控制按钮
    ['game-build-btn', 'game-earthquake-btn', 'game-foundation-btn', 'game-reinforce-btn', 'game-difficulty-select'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
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
      animation: gameShake 0.1s ease-in-out infinite;
    }
    @keyframes gameShake {
      0%, 100% { transform: translateX(0) rotate(0deg); }
      25% { transform: translateX(calc(var(--shake-intensity, 8px) * -1)) rotate(-1deg); }
      75% { transform: translateX(var(--shake-intensity, 8px)) rotate(1deg); }
    }
    .game-floor {
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .game-floor.reinforced {
      border: 2px solid #fbbf24;
      box-shadow: 0 0 15px rgba(251, 191, 36, 0.5);
    }
    .game-foundation {
      animation: pulse 2s ease-in-out infinite;
      transition: all 0.3s ease-out;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
      50% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.6); }
    }
    .game-floor.damaged-light {
      background: linear-gradient(135deg, #f59e0b, #d97706) !important;
      transform: skewX(-2deg);
    }
    .game-floor.damaged-medium {
      background: linear-gradient(135deg, #ef4444, #dc2626) !important;
      animation: sway 0.5s ease-in-out infinite;
    }
    .game-floor.damaged-heavy {
      background: linear-gradient(135deg, #991b1b, #7f1d1d) !important;
      opacity: 0.7;
      transform: scale(0.95);
    }
    @keyframes sway {
      0%, 100% { transform: skewX(-3deg); }
      50% { transform: skewX(3deg); }
    }
    #gameCanvas::-webkit-scrollbar {
      width: 6px;
    }
    #gameCanvas::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    #gameCanvas::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
    #gameCanvas::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `;
  document.head.appendChild(styleEl);
}