// ============================================================
// 济小震 · 地震模拟实验室 — 结构动力学仿真引擎
// 基于反应谱法 (FEMA 440) + SDOF 时程分析 + Canvas 2D 动画
// ============================================================

// ---------- 建筑结构数据库 ----------
const BUILDING_DB = {
  masonry: {
    name: '砌体结构', eng: 'Masonry', icon: 'fa-warehouse',
    T: 0.2, xi: 0.05, mu: 1.5, Fy: 0.06,
    code: 'GB50003', codeName: '砌体结构设计规范',
    color: '#c67b4b', colorLight: '#e8c9a0', colorDark: '#8b4513',
    fragility: '脆性破坏 — 抗侧力差，低震易损',
    components: [
      { name: '承重墙体', pct: 55, vuln: 1.3 },
      { name: '构造柱',   pct: 15, vuln: 0.8 },
      { name: '楼板',     pct: 18, vuln: 0.9 },
      { name: '基础',     pct: 12, vuln: 0.5 }
    ]
  },
  rcframe: {
    name: 'RC框架结构', eng: 'RC Frame', icon: 'fa-building-columns',
    T: 0.5, xi: 0.05, mu: 4.0, Fy: 0.18,
    code: 'GB50011', codeName: '建筑抗震设计规范',
    color: '#78909c', colorLight: '#cfd8dc', colorDark: '#455a64',
    fragility: '延性耗能 — 梁铰机制，抗震性能优良',
    components: [
      { name: '框架柱',   pct: 30, vuln: 1.1 },
      { name: '框架梁',   pct: 30, vuln: 0.9 },
      { name: '填充墙',   pct: 25, vuln: 1.4 },
      { name: '梁柱节点', pct: 15, vuln: 1.0 }
    ]
  },
  steel: {
    name: '钢框架结构', eng: 'Steel Frame', icon: 'fa-building',
    T: 1.2, xi: 0.02, mu: 6.0, Fy: 0.22,
    code: 'GB50017', codeName: '钢结构设计规范',
    color: '#5c7c99', colorLight: '#b0c4de', colorDark: '#2c3e50',
    fragility: '高延性 — 自重轻、柔性大，高层抗震优选',
    components: [
      { name: '钢柱',     pct: 28, vuln: 0.8 },
      { name: '钢梁',     pct: 22, vuln: 0.7 },
      { name: '节点连接', pct: 30, vuln: 1.2 },
      { name: '支撑系统', pct: 20, vuln: 0.9 }
    ]
  },
  shearwall: {
    name: '剪力墙结构', eng: 'Shear Wall', icon: 'fa-archway',
    T: 0.3, xi: 0.06, mu: 3.0, Fy: 0.26,
    code: 'GB50011', codeName: '建筑抗震设计规范',
    color: '#8d9b9e', colorLight: '#d5dbdb', colorDark: '#566573',
    fragility: '侧向刚度极大 — 位移小、承载力高',
    components: [
      { name: '剪力墙',   pct: 50, vuln: 0.7 },
      { name: '连梁',     pct: 22, vuln: 1.3 },
      { name: '边缘构件', pct: 15, vuln: 0.8 },
      { name: '基础',     pct: 13, vuln: 0.5 }
    ]
  }
};

// 破坏等级定义 (DBJ 标准)
const DAMAGE_GRADES = [
  { min: 0,    max: 0.10, level: '完好',   cls: 'intact',   emoji: '✅', color: '#10b981' },
  { min: 0.10, max: 0.30, level: '轻微',   cls: 'slight',   emoji: '🔧', color: '#f59e0b' },
  { min: 0.30, max: 0.55, level: '中等',   cls: 'moderate', emoji: '⚠️',  color: '#f97316' },
  { min: 0.55, max: 0.85, level: '严重',   cls: 'severe',   emoji: '🔴', color: '#ef4444' },
  { min: 0.85, max: 1.01, level: '倒塌',   cls: 'collapse', emoji: '💥', color: '#7f1d1d' }
];

// ---------- 核心计算函数 ----------

/** 推算PGA (g) */
function calcPGA(magnitude) {
  return 0.05 * Math.pow(10, 0.3 * (magnitude - 5));
}

/** 动力放大系数 β(T,ξ) — 简化设计反应谱 */
function calcBeta(T, xi) {
  const Tg = 0.40; // 特征周期
  let beta0;
  if (T <= 0.1) {
    beta0 = 0.45 + 5.5 * T;
  } else if (T <= Tg) {
    beta0 = 2.5;
  } else if (T <= 2.0) {
    beta0 = 2.5 * Math.pow(Tg / T, 0.9);
  } else {
    beta0 = 2.5 * Math.pow(Tg / 2.0, 0.9) * Math.pow(2.0 / T, 0.9);
  }
  // 阻尼修正 η = sqrt(0.05/ξ)，限制最大值
  const eta = Math.min(1.5, Math.sqrt(0.05 / xi));
  return beta0 * eta;
}

/** 谱加速度 */
function calcSa(pga, T, xi) {
  return pga * calcBeta(T, xi);
}

/** 破坏指数 */
function calcDamageIndex(Sa, Fy, mu) {
  return Math.min(1.0, Sa / (Fy * mu));
}

/** 获取破坏等级 */
function getDamageGrade(D) {
  for (let i = DAMAGE_GRADES.length - 1; i >= 0; i--) {
    if (D >= DAMAGE_GRADES[i].min && D < DAMAGE_GRADES[i].max) {
      return DAMAGE_GRADES[i];
    }
  }
  return DAMAGE_GRADES[0];
}

/** 生成合成地震动加速度时程 (cm/s² → 转为相对值后缩放至PGA) */
function generateGroundMotion(magnitude, duration, dt) {
  const n = Math.floor(duration / dt);
  const raw = new Float32Array(n);

  const tRise  = 0.08 * duration;
  const tStrong = 0.45 * duration;
  const tDecay = duration - tStrong;

  // 用多个频率分量合成
  const freqs = [];
  for (let f = 0.3; f < 20; f += 0.4 + Math.random() * 0.8) {
    freqs.push({ f, phase: Math.random() * 2 * Math.PI, amp: 0.5 + Math.random() * 0.5 });
  }

  for (let i = 0; i < n; i++) {
    const t = i * dt;
    // 包络函数
    let env;
    if (t < tRise) {
      env = Math.pow(t / tRise, 2);
    } else if (t < tStrong) {
      env = 1.0;
    } else {
      env = Math.exp(-2.5 * (t - tStrong) / tDecay);
    }
    // 合成
    let val = 0;
    for (const fc of freqs) {
      val += fc.amp * Math.sin(2 * Math.PI * fc.f * t + fc.phase);
    }
    raw[i] = val * env;
  }

  // 归一化到目标PGA
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(raw[i]));
  if (peak === 0) peak = 1;
  const pga = calcPGA(magnitude);
  const scale = pga / peak;
  for (let i = 0; i < n; i++) raw[i] *= scale;

  return raw;
}

/** Newmark-β 法求解SDOF相对位移响应 */
function computeSDOF(groundAccel, dt, T, xi) {
  const n = groundAccel.length;
  const omega = 2 * Math.PI / T;
  const m = 1.0;
  const k = m * omega * omega;
  const c = 2 * xi * m * omega;

  const disp = new Float32Array(n);
  const vel  = new Float32Array(n);
  const acc  = new Float32Array(n);

  const gamma = 0.5;
  const beta = 1 / 6;
  const dt2 = dt * dt;

  // 等效刚度
  const kStar = k + gamma * c / (beta * dt) + m / (beta * dt2);

  for (let i = 1; i < n; i++) {
    const a1 = m / (beta * dt) + gamma * c / beta;
    const a2 = m / (2 * beta) + dt * (gamma / (2 * beta) - 1) * c;
    const dF = -m * (groundAccel[i] - groundAccel[i - 1]);

    const dP = dF + a1 * vel[i - 1] + a2 * acc[i - 1];
    const du = dP / kStar;
    const dv = gamma * du / (beta * dt) - gamma * vel[i - 1] / beta + dt * (1 - gamma / (2 * beta)) * acc[i - 1];

    disp[i] = disp[i - 1] + du;
    vel[i]  = vel[i - 1]  + dv;
    acc[i]  = -groundAccel[i] - c * vel[i] / m - k * disp[i] / m;
  }

  return { disp, vel, acc };
}

// ---------- 主类 ----------
class EarthquakeSimulator {
  constructor() {
    this.selectedType = null;
    this.magnitude = 5.0;
    this.waveType = 'synthetic'; // 'synthetic' | 'kobe'
    this.isSimulating = false;
    this.animFrame = null;

    // 画布相关
    this.canvas = null;
    this.ctx = null;
    this.cW = 800;
    this.cH = 480;

    // 动画数据
    this.groundMotion = null;
    this.buildingResponse = null;
    this.displayWindow = null; // { start, end } indices into the arrays
    this.animStartTime = 0;
    this.animDuration = 7000; // ms for animation playback
    this.dt = 0.005; // 200Hz simulation

    // 模拟结果
    this.simResult = null;

    // Kobe 真实地震波数据
    this.kobeData = null;
  }

  init() {
    this.canvas = document.getElementById('simCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.cW = this.canvas.width;
      this.cH = this.canvas.height;
      this.drawIdleScene();
    }

    // 建筑类型点击
    document.querySelectorAll('.building-card').forEach(card => {
      card.addEventListener('click', () => this.selectBuilding(card.dataset.type));
    });

    // 震级滑块
    const slider = document.getElementById('magSlider');
    if (slider) {
      slider.addEventListener('input', () => this.updateMagnitude(parseFloat(slider.value)));
    }

    // 按钮
    const startBtn = document.getElementById('startSimBtn');
    if (startBtn) startBtn.addEventListener('click', () => this.startSimulation());
    const resetBtn = document.getElementById('resetSimBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => this.reset());

    // 地震波选择按钮
    document.querySelectorAll('.wave-btn').forEach(btn => {
      btn.addEventListener('click', () => this.selectWave(btn.dataset.wave));
    });

    // 预加载 Kobe 地震波
    this.loadKobeData();

    // 响应式canvas
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    console.log('✅ 地震模拟实验室初始化完成');
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const wrapper = this.canvas.parentElement;
    if (!wrapper) return;
    const maxW = wrapper.clientWidth - 4;
    const scale = maxW / this.cW;
    this.canvas.style.width = maxW + 'px';
    this.canvas.style.height = (this.cH * scale) + 'px';
  }

  // ---------- 交互 ----------
  selectBuilding(typeKey) {
    if (this.isSimulating) return;
    this.selectedType = typeKey;
    document.querySelectorAll('.building-card').forEach(c => c.classList.remove('selected'));
    const card = document.querySelector(`.building-card[data-type="${typeKey}"]`);
    if (card) card.classList.add('selected');
    this.drawIdleScene();
  }

  updateMagnitude(val) {
    this.magnitude = val;
    document.getElementById('magValue').textContent = val.toFixed(1);
    const tag = document.getElementById('magTag');
    if (val < 4)      { tag.textContent = '微弱'; tag.style.background = '#10b981'; }
    else if (val < 5) { tag.textContent = '轻震'; tag.style.background = '#84cc16'; }
    else if (val < 6) { tag.textContent = '中等'; tag.style.background = '#f59e0b'; }
    else if (val < 7) { tag.textContent = '强震'; tag.style.background = '#f97316'; }
    else if (val < 8) { tag.textContent = '大震'; tag.style.background = '#ef4444'; }
    else              { tag.textContent = '巨震'; tag.style.background = '#991b1b'; }
  }

  // ---------- 地震波选择 ----------
  async loadKobeData() {
    try {
      const resp = await fetch('/frontend/assets/data/kobe.json');
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      this.kobeData = await resp.json();
      console.log('🌊 Kobe 1995 地震波已加载:', this.kobeData.accel.length, '点, PGA:', this.kobeData.peak.toFixed(3), 'g');
    } catch (err) {
      console.warn('⚠ Kobe 地震波加载失败，仅可用人工合成波:', err.message);
    }
  }

  selectWave(type) {
    if (this.isSimulating) return;
    this.waveType = type;
    document.querySelectorAll('.wave-btn').forEach(b => b.classList.toggle('active', b.dataset.wave === type));
    const info = document.getElementById('waveInfo');
    if (type === 'kobe' && this.kobeData) {
      info.innerHTML = '<i class="fas fa-check-circle" style="color:#10b981;"></i> Kobe 1995 (Mw 6.9) — 记录于神户海洋气象台，PGA = ' + this.kobeData.peak.toFixed(3) + ' g，持时 50s';
    } else if (type === 'kobe') {
      info.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#f59e0b;"></i> Kobe 地震波数据加载失败，请刷新页面重试';
    } else {
      info.innerHTML = '基于震级和场地特征随机合成的加速度时程';
    }
  }

  /** 获取地震动：人工合成 或 Kobe 缩放 */
  getGroundMotion(magnitude, duration) {
    if (this.waveType === 'kobe' && this.kobeData) {
      // 将 Kobe 数据缩放到目标震级对应的 PGA
      const targetPGA = calcPGA(magnitude);
      const scale = targetPGA / this.kobeData.peak;
      const src = this.kobeData.accel;
      const out = new Float32Array(src.length);
      for (let i = 0; i < src.length; i++) out[i] = src[i] * scale;
      return { data: out, dt: this.kobeData.dt, name: 'Kobe 1995' };
    }
    // 人工合成
    const data = generateGroundMotion(magnitude, duration, this.dt);
    return { data, dt: this.dt, name: 'Synthetic' };
  }

  // ---------- 模拟 ----------
  startSimulation() {
    if (this.isSimulating) return;
    if (!this.selectedType) {
      alert('请先选择一种建筑结构类型！');
      return;
    }

    this.isSimulating = true;
    this.simResult = null;

    // 隐藏结果，显示进度
    document.getElementById('resultsCard').style.display = 'none';
    document.getElementById('simProgress').style.display = 'block';
    document.getElementById('canvasOverlay').style.display = 'none';

    const bd = BUILDING_DB[this.selectedType];

    // —— 第一步：PGA推算 ——
    const pga = calcPGA(this.magnitude);
    const log10PGA = Math.log10(pga / 0.05);
    const pgaGal = pga * 980;

    // —— 第二步：β谱计算 ——
    const Tg = 0.40;
    let beta0, betaFormula;
    if (bd.T <= 0.1) {
      beta0 = 0.45 + 5.5 * bd.T;
      betaFormula = `β₀ = 0.45 + 5.5×${bd.T} = ${beta0.toFixed(3)} (短周期直线段)`;
    } else if (bd.T <= Tg) {
      beta0 = 2.5;
      betaFormula = `β₀ = 2.5 (平台段, T≤Tg=${Tg}s)`;
    } else if (bd.T <= 2.0) {
      beta0 = 2.5 * Math.pow(Tg / bd.T, 0.9);
      betaFormula = `β₀ = 2.5 × (${Tg}/${bd.T})⁰·⁹ = ${beta0.toFixed(3)} (速度控制段)`;
    } else {
      beta0 = 2.5 * Math.pow(Tg / 2.0, 0.9) * Math.pow(2.0 / bd.T, 0.9);
      betaFormula = `β₀ = 2.5 × (${Tg}/2.0)⁰·⁹ × (2.0/${bd.T})⁰·⁹ = ${beta0.toFixed(3)} (位移控制段)`;
    }
    const eta = Math.min(1.5, Math.sqrt(0.05 / bd.xi));
    const beta = beta0 * eta;

    // —— 第三步：谱加速度 ——
    const Sa = pga * beta;
    const SaGal = Sa * 980;

    // —— 第四步：破坏指数 ——
    const equivResistance = bd.Fy * bd.mu;
    const rawD = Sa / equivResistance;
    const D = Math.min(1.0, rawD);
    const grade = getDamageGrade(D);

    // 获取地震动（人工合成 或 真实记录）
    const totalDuration = 8 + this.magnitude * 2;
    const gm = this.getGroundMotion(this.magnitude, totalDuration);
    this.groundMotion = gm.data;
    const simDt = gm.dt || this.dt;

    // SDOF响应
    const resp = computeSDOF(this.groundMotion, simDt, bd.T, bd.xi);
    this.buildingResponse = resp;

    // 找到响应最强的窗口（~6秒窗口用于播放）
    const animSamples = Math.floor(6000 / (simDt * 1000));
    this.displayWindow = this.findPeakWindow(animSamples);

    // 保存结果
    this.simResult = {
      pga, pgaGal, beta, beta0, eta, betaFormula, Sa, SaGal,
      D, rawD, equivResistance, grade,
      building: bd, Tg,
      componentDamages: this.calcComponentDamages(D, bd),
      groundPeak: this.findArrayPeak(this.groundMotion),
      respPeak: this.findArrayPeak(resp.disp),
      totalDuration, dt: simDt,
      waveType: this.waveType, waveName: gm.name
    };

    // 启动动画
    this.animStartTime = performance.now();
    this.animate();
  }

  findPeakWindow(windowSamples) {
    const resp = this.buildingResponse;
    if (!resp) return { start: 0, end: windowSamples };
    const n = resp.disp.length;
    if (windowSamples >= n) return { start: 0, end: n };

    // 滑动窗口找最大RMS
    let maxRMS = 0;
    let bestStart = 0;
    const step = Math.max(1, Math.floor(windowSamples / 20));
    for (let i = 0; i <= n - windowSamples; i += step) {
      let sumSq = 0;
      for (let j = i; j < i + windowSamples; j += 3) {
        sumSq += resp.disp[j] * resp.disp[j];
      }
      if (sumSq > maxRMS) {
        maxRMS = sumSq;
        bestStart = i;
      }
    }
    return { start: bestStart, end: Math.min(bestStart + windowSamples, n) };
  }

  findArrayPeak(arr) {
    let peak = 0;
    for (let i = 0; i < arr.length; i++) {
      peak = Math.max(peak, Math.abs(arr[i]));
    }
    return peak;
  }

  calcComponentDamages(D, bd) {
    return bd.components.map(comp => {
      const dr = Math.min(1, D * comp.vuln + (Math.random() - 0.5) * 0.08);
      return { ...comp, damageRate: Math.max(0, dr) };
    });
  }

  // ---------- Canvas 动画 ----------
  animate() {
    if (!this.isSimulating) return;

    const elapsed = performance.now() - this.animStartTime;
    const progress = Math.min(1, elapsed / this.animDuration);
    document.getElementById('progressFill').style.width = (progress * 100).toFixed(1) + '%';

    if (progress >= 1) {
      this.finishSimulation();
      return;
    }

    this.drawFrame(progress);
    this.animFrame = requestAnimationFrame(() => this.animate());
  }

  drawFrame(progress) {
    const ctx = this.ctx;
    const W = this.cW;
    const H = this.cH;
    if (!ctx) return;

    const bd = BUILDING_DB[this.selectedType];
    const win = this.displayWindow;
    const gm = this.groundMotion;
    const resp = this.buildingResponse;

    // 当前数据帧索引
    const winLen = win.end - win.start;
    const dataIdx = win.start + Math.floor(progress * winLen);
    const safeIdx = Math.min(dataIdx, gm.length - 1);

    const groundDisp = gm[safeIdx];   // 地面加速度 (用于驱动视觉位移)
    const buildingDisp = resp ? resp.disp[safeIdx] : 0;

    // 归一化用于视觉
    const maxGD = Math.max(0.001, this.simResult ? this.simResult.groundPeak : 0.01);
    const maxBD = Math.max(0.001, this.simResult ? this.simResult.respPeak : 0.01);
    const visualGround = (groundDisp / maxGD) * 15;
    const visualBldg = (buildingDisp / maxBD) * 30;

    // 清屏
    ctx.clearRect(0, 0, W, H);

    // 背景网格
    ctx.strokeStyle = 'rgba(150,150,150,0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // 损伤导致的裂缝效果（基于综合破坏指数D）
    const D = this.simResult ? this.simResult.D : 0;
    const crackAlpha = D * progress; // 随时间逐渐显现

    // --- 上部：建筑动画 ---
    const groundY = 320;
    const bldgBaseX = W / 2;
    const bldgW = 70;
    const bldgH = 200;

    // 地面线
    ctx.save();
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();
    // 地面振动后画锯齿
    ctx.strokeStyle = 'rgba(139,90,43,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY + visualGround);
    for (let x = 0; x < W; x += 4) {
      ctx.lineTo(x, groundY + visualGround + Math.sin(x * 0.5 + progress * 20) * 3);
    }
    ctx.stroke();
    ctx.restore();

    // 建筑
    this.drawBuilding(ctx, bldgBaseX + visualGround, groundY, bldgW, bldgH,
      visualBldg, bd, progress, crackAlpha, D);

    // --- 下部：地震波形 ---
    const waveTop = groundY + 30;
    const waveH = H - waveTop - 40;
    this.drawWaveform(ctx, waveTop, waveH, win, progress, W);

    // 图例
    ctx.fillStyle = '#888';
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillText('地震动加速度记录', 12, waveTop + 16);
    ctx.fillText('建筑顶部相对位移', 12, 20);

    // 建筑响应曲线
    this.drawResponseCurve(ctx, 12, 28, W - 24, 50, resp, win, progress, bd.color);
  }

  drawBuilding(ctx, baseX, baseY, w, h, sway, bd, progress, crackAlpha, D) {
    ctx.save();
    // 建筑整体平动+摆动
    const pivotX = baseX;
    const pivotY = baseY;

    ctx.translate(pivotX, pivotY);
    const tiltAngle = sway * 0.015; // 摆动角（弧度）
    ctx.rotate(tiltAngle);

    // 建筑主体
    const halfW = w / 2;

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(-halfW + 4, -h + 4, w, h);

    // 主体填充
    const grad = ctx.createLinearGradient(-halfW, 0, halfW, 0);
    grad.addColorStop(0, bd.colorDark);
    grad.addColorStop(0.3, bd.color);
    grad.addColorStop(0.7, bd.colorLight);
    grad.addColorStop(1, bd.colorDark);
    ctx.fillStyle = grad;
    ctx.fillRect(-halfW, -h, w, h);

    // 边框
    ctx.strokeStyle = bd.colorDark;
    ctx.lineWidth = 2;
    ctx.strokeRect(-halfW, -h, w, h);

    // 楼层线和窗户
    const floors = 8;
    const floorH = h / floors;
    for (let i = 1; i < floors; i++) {
      const y = -i * floorH;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-halfW + 4, y);
      ctx.lineTo(halfW - 4, y);
      ctx.stroke();

      // 窗户
      const winW = 8;
      const winH = floorH * 0.4;
      const winY = y + floorH * 0.55;
      const cols = 3;
      const spacing = w / (cols + 1);
      for (let c = 1; c <= cols; c++) {
        const wx = -halfW + c * spacing - winW / 2;
        ctx.fillStyle = 'rgba(200,220,240,0.6)';
        ctx.fillRect(wx, winY, winW, winH);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(wx, winY, winW, winH);
      }
    }

    // 屋顶
    ctx.fillStyle = bd.colorDark;
    ctx.fillRect(-halfW - 5, -h - 8, w + 10, 10);
    ctx.strokeStyle = bd.colorDark;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-halfW - 5, -h - 8, w + 10, 10);

    // 地基
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(-halfW - 6, 0, w + 12, 8);

    // --- 裂缝效果 (随破坏指数显现) ---
    if (crackAlpha > 0.01) {
      ctx.strokeStyle = `rgba(30,10,10,${crackAlpha * 0.8})`;
      ctx.lineWidth = 1 + crackAlpha * 2;
      const crackCount = Math.floor(D * 12);
      for (let c = 0; c < crackCount; c++) {
        const cx = -halfW + 5 + Math.random() * (w - 10);
        const cy = -h + 10 + Math.random() * (h - 20);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (Math.random() - 0.5) * 20, cy + (Math.random() - 0.5) * 15);
        ctx.stroke();
      }
    }

    // 标签
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(bd.name, 0, -h - 16);

    ctx.restore();
  }

  drawWaveform(ctx, top, height, win, progress, canvasW) {
    const gm = this.groundMotion;
    if (!gm) return;

    ctx.save();
    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(10, top, canvasW - 20, height);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, top, canvasW - 20, height);

    // 中心线
    const midY = top + height / 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(10, midY);
    ctx.lineTo(canvasW - 10, midY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 波形裁剪
    ctx.beginPath();
    ctx.rect(10, top, canvasW - 20, height);
    ctx.clip();

    // 绘制波形
    const winLen = win.end - win.start;
    const displayStart = win.start;
    // 多画一些前后数据让波形连续滚动
    const viewSamples = Math.floor(winLen * 1.2);
    const viewStart = Math.max(0, Math.floor(displayStart - winLen * 0.1));
    const viewEnd = Math.min(gm.length, viewStart + viewSamples);

    const maxVal = this.simResult ? Math.max(0.001, this.simResult.groundPeak) : 0.01;
    const amp = height * 0.4;
    const plotWidth = canvasW - 40;
    const totalViewSamples = viewEnd - viewStart;
    const cursorRelPos = (displayStart + progress * winLen - viewStart) / totalViewSamples;

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let firstPoint = true;
    const step = Math.max(1, Math.floor(totalViewSamples / plotWidth));
    for (let i = 0; i < totalViewSamples; i += step) {
      const val = gm[viewStart + i];
      const x = 20 + (i / totalViewSamples) * plotWidth;
      const y = midY - (val / maxVal) * amp;
      if (firstPoint) { ctx.moveTo(x, y); firstPoint = false; }
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 播放位置指示线
    const cursorX = 20 + cursorRelPos * plotWidth;
    ctx.strokeStyle = '#3b6df0';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(cursorX, top + 2);
    ctx.lineTo(cursorX, top + height - 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  drawResponseCurve(ctx, x, y, w, h, resp, win, progress, color) {
    if (!resp) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fillRect(x, y, w, h);

    const winLen = win.end - win.start;
    const dataStart = win.start;
    const totalSamples = winLen;
    const midY = y + h / 2;
    const maxVal = this.simResult ? Math.max(0.001, this.simResult.respPeak) : 0.01;
    const amp = h * 0.4;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let first = true;
    const step = Math.max(1, Math.floor(totalSamples / w));
    for (let i = 0; i < totalSamples; i += step) {
      const val = resp.disp[dataStart + i];
      const px = x + (i / totalSamples) * w;
      const py = midY - (val / maxVal) * amp;
      if (first) { ctx.moveTo(px, py); first = false; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 进度指示
    const cursorPx = x + progress * w;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cursorPx, midY - (resp.disp[dataStart + Math.floor(progress * (totalSamples - 1))] / maxVal) * amp, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawIdleScene() {
    const ctx = this.ctx;
    if (!ctx) return;
    const W = this.cW;
    const H = this.cH;
    ctx.clearRect(0, 0, W, H);

    // 网格
    ctx.strokeStyle = 'rgba(150,150,150,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const groundY = 320;
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();

    if (this.selectedType) {
      const bd = BUILDING_DB[this.selectedType];
      const bldgBaseX = W / 2;
      this.drawBuilding(ctx, bldgBaseX, groundY, 70, 200, 0, bd, 0, 0, 0);
    }

    // 提示
    ctx.fillStyle = '#aaa';
    ctx.font = '15px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    if (!this.selectedType) {
      ctx.fillText('选择建筑类型后，此处将显示结构预览', W / 2, H / 2 - 30);
    }
    ctx.fillText('地震波形窗口', W / 2, groundY + 90);
    ctx.textAlign = 'start';
  }

  // ---------- 模拟结束 ----------
  finishSimulation() {
    this.isSimulating = false;
    if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null; }

    document.getElementById('simProgress').style.display = 'none';
    document.getElementById('progressFill').style.width = '0%';

    // 最终帧
    this.drawFinalFrame();
    this.showResults();
  }

  drawFinalFrame() {
    // 保持最后一帧的损伤状态
    const ctx = this.ctx;
    const W = this.cW;
    const H = this.cH;
    const bd = BUILDING_DB[this.selectedType];
    const D = this.simResult ? this.simResult.D : 0;

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(150,150,150,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const groundY = 320;
    ctx.strokeStyle = '#5a4a3a';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();

    // 用最终位移绘制倾斜建筑
    const finalSway = D > 0.5 ? (D - 0.5) * 40 : 0;
    this.drawBuilding(ctx, W / 2, groundY, 70, 200, finalSway, bd, 1, Math.min(1, D), D);

    // 破坏等级标签
    const grade = this.simResult ? this.simResult.grade : getDamageGrade(0);
    ctx.fillStyle = grade.color;
    ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${grade.emoji} 破坏等级：${grade.level}`, W / 2, groundY + 60);
    ctx.textAlign = 'start';
  }

  showResults() {
    const r = this.simResult;
    if (!r) return;
    const bd = r.building;
    const g = r.grade;

    const card = document.getElementById('resultsCard');
    card.style.display = 'block';

    // 构件破坏率表格
    const compRows = r.componentDamages.map(c =>
      `<tr>
        <td>${c.name}</td>
        <td>${c.pct}%</td>
        <td>${(c.damageRate * 100).toFixed(1)}%</td>
        <td><div class="mini-bar"><div class="mini-bar-fill" style="width:${(c.damageRate*100).toFixed(0)}%;background:${c.damageRate > 0.5 ? '#ef4444' : c.damageRate > 0.2 ? '#f59e0b' : '#10b981'}"></div></div></td>
      </tr>`
    ).join('');

    // 破坏等级参考表
    const gradeRows = DAMAGE_GRADES.map(gr => {
      const isCurrent = gr.level === g.level;
      return `<tr style="${isCurrent ? 'background:var(--accent-glow);font-weight:bold;' : ''}">
        <td>${gr.emoji}</td>
        <td>${gr.level}</td>
        <td>${gr.min} ≤ D < ${gr.max === 1.01 ? '1.0' : gr.max}</td>
        <td style="color:${gr.color};">${isCurrent ? '◀ 当前' : ''}</td>
      </tr>`;
    }).join('');

    // 构件破坏率计算方法说明
    const compMethodText = r.componentDamages.map(c => {
      const dr = c.damageRate;
      const drPct = (dr * 100).toFixed(1);
      return `D×${c.vuln} = ${r.D.toFixed(3)}×${c.vuln} = ${(r.D*c.vuln).toFixed(3)} → ${drPct}%`;
    }).join('<br>');

    document.getElementById('resultsContent').innerHTML = `
      <!-- ===== 破坏等级总览 ===== -->
      <div class="result-header" style="text-align:center; margin-bottom:1.5rem;">
        <div style="font-size:4rem;">${g.emoji}</div>
        <h3 style="color:${g.color}; font-size:1.6rem;">${g.level}破坏</h3>
        <p style="color:#888;">${bd.name} (${bd.eng}) · ${bd.code} ${bd.codeName}</p>
      </div>

      <!-- ===== 核心指标速览 ===== -->
      <div class="result-grid">
        <div class="result-stat">
          <span class="rs-label">震级 Mw</span>
          <span class="rs-val">${this.magnitude.toFixed(1)}</span>
        </div>
        <div class="result-stat">
          <span class="rs-label">PGA</span>
          <span class="rs-val">${r.pgaGal.toFixed(1)} gal (${r.pga.toFixed(3)}g)</span>
        </div>
        <div class="result-stat">
          <span class="rs-label">谱加速度 Sa</span>
          <span class="rs-val">${r.SaGal.toFixed(1)} gal (${r.Sa.toFixed(3)}g)</span>
        </div>
        <div class="result-stat">
          <span class="rs-label">动力放大系数 β</span>
          <span class="rs-val">${r.beta.toFixed(3)}</span>
        </div>
        <div class="result-stat">
          <span class="rs-label">破坏指数 D</span>
          <span class="rs-val" style="color:${g.color}">${r.D.toFixed(4)}</span>
        </div>
        <div class="result-stat">
          <span class="rs-label">等效抗力 Fy×μ</span>
          <span class="rs-val">${bd.Fy.toFixed(2)}g × ${bd.mu} = ${r.equivResistance.toFixed(2)}g</span>
        </div>
      </div>

      <!-- ===== 完整计算过程 ===== -->
      <div class="calc-steps" style="margin-top:2rem;">
        <h3 style="color:var(--accent-primary); margin-bottom:1rem; font-size:1.2rem;">
          <i class="fas fa-square-root-variable"></i> 计算过程详解
        </h3>

        <!-- 步骤1: PGA -->
        <div class="calc-step">
          <div class="calc-step-header" onclick="this.parentElement.classList.toggle('collapsed')">
            <span class="step-num">1</span>
            <span>地震动参数推算 — PGA</span>
            <i class="fas fa-chevron-down step-arrow"></i>
          </div>
          <div class="calc-step-body">
            <div class="formula-box">
              <div class="formula-title">经验公式</div>
              <div class="formula">PGA = 0.05 × 10<sup>0.3 × (Mw − 5)</sup> (g)</div>
            </div>
            <div class="calc-sub">
              代入 Mw = <strong>${this.magnitude.toFixed(1)}</strong>：
              PGA = 0.05 × 10<sup>0.3 × (${this.magnitude.toFixed(1)} − 5)</sup>
              = 0.05 × 10<sup>${(0.3 * (this.magnitude - 5)).toFixed(2)}</sup>
              = 0.05 × <strong>${Math.pow(10, 0.3*(this.magnitude-5)).toFixed(4)}</strong>
              = <strong>${r.pga.toFixed(4)} g</strong>
              = ${r.pgaGal.toFixed(1)} gal &nbsp;(1g = 980 gal)
            </div>
          </div>
        </div>

        <!-- 步骤2: β谱 -->
        <div class="calc-step">
          <div class="calc-step-header" onclick="this.parentElement.classList.toggle('collapsed')">
            <span class="step-num">2</span>
            <span>动力放大系数 β(T, ξ) — 设计反应谱</span>
            <i class="fas fa-chevron-down step-arrow"></i>
          </div>
          <div class="calc-step-body">
            <div class="formula-box">
              <div class="formula-title">β谱公式 (GB50011 设计反应谱)</div>
              <div class="formula">
                T<sub>g</sub> = ${r.Tg}s (Ⅱ类场地第一组)<br>
                ${r.betaFormula}<br>
                阻尼修正：η = √(0.05/ξ) = √(0.05/${bd.xi}) = ${r.eta.toFixed(3)}<br>
                β = β₀ × η = ${r.beta0.toFixed(3)} × ${r.eta.toFixed(3)} = <strong>${r.beta.toFixed(3)}</strong>
              </div>
            </div>
            <div class="calc-sub">
              结构自振周期 T = <strong>${bd.T}s</strong>，
              阻尼比 ξ = <strong>${(bd.xi*100).toFixed(0)}%</strong><br>
              阻尼修正系数 η = √(0.05/${bd.xi}) = ${r.eta.toFixed(3)} &nbsp;
              ${r.eta > 1 ? '(低阻尼 → 放大系数增大)' : r.eta < 1 ? '(高阻尼 → 放大系数减小)' : '(标准阻尼 → 无修正)'}<br>
              最终 β = β₀ × η = ${r.beta0.toFixed(3)} × ${r.eta.toFixed(3)} = <strong>${r.beta.toFixed(3)}</strong>
            </div>
          </div>
        </div>

        <!-- 步骤3: Sa -->
        <div class="calc-step">
          <div class="calc-step-header" onclick="this.parentElement.classList.toggle('collapsed')">
            <span class="step-num">3</span>
            <span>谱加速度 Sa — 反应谱法 (FEMA 440)</span>
            <i class="fas fa-chevron-down step-arrow"></i>
          </div>
          <div class="calc-step-body">
            <div class="formula-box">
              <div class="formula-title">反应谱公式</div>
              <div class="formula">Sa = PGA × β(T, ξ)</div>
            </div>
            <div class="calc-sub">
              Sa = <strong>${r.pga.toFixed(4)}g</strong> × <strong>${r.beta.toFixed(3)}</strong>
              = <strong>${r.Sa.toFixed(4)} g</strong>
              = ${r.SaGal.toFixed(1)} gal
            </div>
          </div>
        </div>

        <!-- 步骤4: D -->
        <div class="calc-step">
          <div class="calc-step-header" onclick="this.parentElement.classList.toggle('collapsed')">
            <span class="step-num">4</span>
            <span>破坏指数 D — 屈服与延性综合判定</span>
            <i class="fas fa-chevron-down step-arrow"></i>
          </div>
          <div class="calc-step-body">
            <div class="formula-box">
              <div class="formula-title">破坏指数公式</div>
              <div class="formula">D = min[ 1.0 , Sa / (F<sub>y</sub> × μ) ]</div>
            </div>
            <div class="calc-sub">
              屈服承载力 F<sub>y</sub> = <strong>${bd.Fy.toFixed(2)}g</strong> (${bd.name}规范值)<br>
              延性系数 μ = <strong>${bd.mu}</strong><br>
              等效抗力 = F<sub>y</sub> × μ = ${bd.Fy.toFixed(2)} × ${bd.mu} = <strong>${r.equivResistance.toFixed(2)}g</strong><br>
              <br>
              未截断值：D<sub>raw</sub> = Sa / (F<sub>y</sub>×μ)
              = ${r.Sa.toFixed(4)} / ${r.equivResistance.toFixed(2)}
              = <strong>${r.rawD.toFixed(4)}</strong><br>
              ${r.rawD > 1.0 ? `D<sub>raw</sub> > 1.0 → 截断为 D = <strong style="color:${g.color};">1.0000</strong> (已超结构极限)` : `D = <strong style="color:${g.color};">${r.D.toFixed(4)}</strong>`}
            </div>
          </div>
        </div>

        <!-- 步骤5: 破坏等级判定 -->
        <div class="calc-step">
          <div class="calc-step-header" onclick="this.parentElement.classList.toggle('collapsed')">
            <span class="step-num">5</span>
            <span>破坏等级判定 — 《建筑地震破坏等级划分标准》DBJ</span>
            <i class="fas fa-chevron-down step-arrow"></i>
          </div>
          <div class="calc-step-body">
            <table class="damage-table">
              <thead><tr><th></th><th>破坏等级</th><th>D 值范围</th><th>判定</th></tr></thead>
              <tbody>${gradeRows}</tbody>
            </table>
            <div class="calc-sub" style="margin-top:0.5rem;">
              D = ${r.D.toFixed(3)} ∈ [${g.min}, ${g.max}) → <strong style="color:${g.color}; font-size:1.1rem;">${g.emoji} ${g.level}破坏</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== 构件破坏率 ===== -->
      <div style="margin-top:2rem;">
        <h4 style="color:var(--accent-primary); margin-bottom:0.8rem;">
          <i class="fas fa-cubes"></i> 构件破坏率分析
        </h4>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.8rem;">
          各构件破坏率 = min(100%, D × 构件易损性系数 × 100%)，构件易损性系数依据${bd.code}及相关震害统计确定。
        </p>
        <table class="damage-table">
          <thead><tr><th>构件</th><th>占比</th><th>破坏率</th><th>损伤程度</th></tr></thead>
          <tbody>${compRows}</tbody>
        </table>
        <details style="margin-top:0.8rem; font-size:0.82rem; color:var(--text-muted);">
          <summary>查看各构件计算明细</summary>
          <div style="padding:0.5rem;line-height:2;">
            ${compMethodText}
          </div>
        </details>
      </div>

      <!-- ===== 工程判断 ===== -->
      <div class="theory-note" style="margin-top:1.5rem; padding:1rem; background:var(--bg-tertiary); border-radius:10px; border-left:4px solid var(--accent-primary);">
        <h4 style="color:var(--accent-primary); margin-bottom:0.5rem;">
          <i class="fas fa-lightbulb"></i> 工程洞察
        </h4>
        <p style="line-height:1.8;">
          <strong>结构特性：</strong>${bd.fragility}<br>
          <strong>判断：</strong>${r.D > 0.55 ? '该结构在此震级下已严重受损，Sa远超等效抗力，需更换或大规模加固。' :
            r.D > 0.30 ? '该结构在此震级下已进入中度塑性阶段，部分构件出现损伤，建议进行抗震鉴定与修复。' :
            r.D > 0.10 ? '该结构在此震级下出现轻微损伤，主要发生在非结构构件，主体结构基本完好。' :
            '该结构在此震级下保持弹性响应，抗震性能满足规范要求，无需修复。'}
        </p>
      </div>
    `;

    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- 重置 ----------
  reset() {
    if (this.isSimulating) {
      this.isSimulating = false;
      if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null; }
    }
    this.selectedType = null;
    this.magnitude = 5.0;
    this.groundMotion = null;
    this.buildingResponse = null;
    this.displayWindow = null;
    this.simResult = null;

    document.getElementById('magSlider').value = 5;
    this.updateMagnitude(5.0);
    document.querySelectorAll('.building-card').forEach(c => c.classList.remove('selected'));
    document.getElementById('resultsCard').style.display = 'none';
    document.getElementById('simProgress').style.display = 'none';
    document.getElementById('canvasOverlay').style.display = 'flex';
    document.getElementById('progressFill').style.width = '0%';

    this.drawIdleScene();
  }
}

// 暴露全局
window.JiXiaoZhen.Game = new EarthquakeSimulator();
window.JiXiaoZhen.initGame = () => window.JiXiaoZhen.Game.init();

// 注入样式
if (!document.getElementById('eqsim-styles')) {
  const style = document.createElement('style');
  style.id = 'eqsim-styles';
  style.textContent = `
    /* 建筑选择网格 */
    .building-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .building-card {
      background: var(--bg-tertiary);
      border: 2px solid var(--border-subtle);
      border-radius: 14px;
      padding: 1.5rem 1rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(.4,0,.2,1);
      position: relative;
    }
    .building-card:hover {
      transform: translateY(-6px);
      box-shadow: var(--shadow-lg);
      border-color: var(--accent-tertiary);
    }
    .building-card.selected {
      border-color: var(--accent-primary);
      background: var(--accent-glow);
      box-shadow: 0 0 24px var(--accent-glow);
    }
    .building-card.selected::before {
      content: '✓';
      position: absolute;
      top: 10px;
      right: 14px;
      font-size: 1.2rem;
      font-weight: bold;
      color: var(--accent-primary);
    }
    .bc-icon {
      width: 90px;
      height: 90px;
      margin: 0 auto 0.6rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bldg-svg {
      width: 82px;
      height: 82px;
      display: block;
    }
    /* 暗色模式下 SVG 中的白色窗格调暗 */
    [data-theme="dark"] .bldg-svg rect[fill="#fff"] {
      fill: #d0d8e0;
    }
    .building-card h3 {
      font-size: 1.15rem;
      color: var(--text-primary);
      margin-bottom: 0.2rem;
    }
    .bc-eng {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 0.6rem;
    }
    .bc-params {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 0.5rem;
    }
    .bc-params span {
      background: var(--bg-secondary);
      color: var(--accent-primary);
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      border: 1px solid var(--border-subtle);
    }
    .bc-desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 0.3rem;
    }
    .bc-code {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    /* 震级滑块 */
    .mag-slider-container {
      padding: 0.5rem 1rem;
    }
    .mag-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    #magSlider {
      width: 100%;
      height: 8px;
      -webkit-appearance: none;
      appearance: none;
      background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444, #7f1d1d);
      border-radius: 4px;
      outline: none;
      cursor: pointer;
    }
    #magSlider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #fff;
      border: 3px solid var(--accent-primary);
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    .mag-current {
      text-align: center;
      margin-top: 0.8rem;
      font-size: 1.1rem;
    }
    .mag-tag {
      display: inline-block;
      margin-left: 0.5rem;
      padding: 2px 12px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #fff;
      background: #f59e0b;
    }

    /* Canvas */
    .canvas-wrapper {
      position: relative;
      border: 2px dashed var(--accent-tertiary);
      border-radius: 12px;
      overflow: hidden;
      margin-top: 0.5rem;
      background: var(--bg-secondary);
    }
    .canvas-wrapper canvas {
      display: block;
      width: 100%;
      height: auto;
    }
    .canvas-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.03);
      color: var(--text-muted);
      font-size: 1.1rem;
      pointer-events: none;
    }
    .canvas-overlay i {
      font-size: 3rem;
      margin-bottom: 0.8rem;
      opacity: 0.5;
    }

    /* 进度条 */
    .progress-bar {
      height: 6px;
      background: var(--bg-tertiary);
      border-radius: 3px;
      overflow: hidden;
      margin-top: 0.8rem;
    }
    .progress-fill {
      height: 100%;
      width: 0%;
      background: var(--gradient-accent);
      border-radius: 3px;
      transition: width 0.1s linear;
    }
    #simTimeDisplay {
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-top: 0.4rem;
    }

    /* 结果 */
    .result-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.8rem;
    }
    .result-stat {
      background: var(--bg-tertiary);
      border-radius: 10px;
      padding: 0.8rem 1rem;
    }
    .rs-label {
      display: block;
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-bottom: 0.3rem;
    }
    .rs-val {
      display: block;
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .damage-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    .damage-table th {
      background: var(--bg-tertiary);
      padding: 0.6rem 0.8rem;
      text-align: left;
      color: var(--text-secondary);
      font-weight: 600;
      border-bottom: 2px solid var(--border-subtle);
    }
    .damage-table td {
      padding: 0.55rem 0.8rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .mini-bar {
      width: 80px;
      height: 8px;
      background: var(--bg-tertiary);
      border-radius: 4px;
      overflow: hidden;
    }
    .mini-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }
    /* 计算步骤 */
    .calc-steps { display:flex; flex-direction:column; gap:0.8rem; }
    .calc-step {
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      overflow: hidden;
      background: var(--bg-secondary);
    }
    .calc-step-header {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.85rem 1rem;
      cursor: pointer;
      user-select: none;
      font-weight: 600;
      color: var(--text-primary);
      transition: background 0.2s;
    }
    .calc-step-header:hover { background: var(--bg-tertiary); }
    .step-num {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--accent-primary);
      color: #fff;
      font-size: 0.85rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .step-arrow {
      margin-left: auto;
      transition: transform 0.3s;
      color: var(--text-muted);
    }
    .calc-step.collapsed .step-arrow { transform: rotate(-90deg); }
    .calc-step.collapsed .calc-step-body { display: none; }
    .calc-step-body {
      padding: 0 1rem 1rem 1rem;
      border-top: 1px solid var(--border-subtle);
      padding-top: 0.8rem;
    }
    .formula-box {
      background: var(--bg-tertiary);
      border-radius: 8px;
      padding: 0.8rem 1rem;
      margin-bottom: 0.6rem;
      border-left: 3px solid var(--accent-primary);
    }
    .formula-title {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 0.3rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .formula {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.8;
    }
    .calc-sub {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.9;
    }
    .theory-note {
      font-size: 0.9rem;
      line-height: 1.9;
    }
    .theory-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .theory-item {
      background: var(--bg-tertiary);
      border-radius: 10px;
      padding: 1rem 1.2rem;
    }
    .theory-item h4 {
      color: var(--accent-primary);
      font-size: 0.95rem;
      margin-bottom: 0.4rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .theory-item p {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }

    @media (max-width: 768px) {
      .building-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
      }
      .building-card {
        padding: 1rem 0.6rem;
      }
      .result-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}
