// 济小震 · 科技防灾平台 — 通用交互逻辑
document.addEventListener('DOMContentLoaded', function () {

  // ==================== 1. 导航栏高亮 ====================
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // ==================== 2. 主题切换 ====================
  const themeToggle = document.getElementById('themeToggle');
  const htmlElement = document.documentElement;

  const savedTheme = localStorage.getItem('jxz-theme') || 'light';
  htmlElement.setAttribute('data-theme', savedTheme);
  if (themeToggle) updateThemeIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const currentTheme = htmlElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      // 添加主题切换过渡
      document.body.style.transition = 'background-color .4s ease, color .4s ease';
      htmlElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('jxz-theme', newTheme);
      updateThemeIcon(newTheme);

      setTimeout(() => {
        document.body.style.transition = '';
      }, 400);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggle) return;
    const icon = themeToggle.querySelector('i');
    if (!icon) return;
    if (theme === 'dark') {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  }

  // ==================== 3. 滚动渐现动画 ====================
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.card, .feature-card, .hero-card, .knowledge-category').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity .6s cubic-bezier(.4,0,.2,1), transform .6s cubic-bezier(.4,0,.2,1)';
    observer.observe(el);
  });

  // ==================== 4. 按钮波纹效果 ====================
  document.querySelectorAll('.btn, .btn-primary, .btn-secondary, .btn-danger').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px; height: ${size}px;
        left: ${e.clientX - rect.left - size / 2}px;
        top: ${e.clientY - rect.top - size / 2}px;
        border-radius: 50%;
        background: rgba(255,255,255,.3);
        transform: scale(0);
        animation: rippleEffect .6s ease-out forwards;
        pointer-events: none;
      `;
      btn.style.position = btn.style.position || 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // 注入波纹动画 keyframes（如果不存在）
  if (!document.getElementById('ripple-keyframes')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'ripple-keyframes';
    styleEl.textContent = `
      @keyframes rippleEffect {
        to { transform: scale(4); opacity: 0; }
      }
    `;
    document.head.appendChild(styleEl);
  }

});

// ==================== 页面跳转辅助 ====================
function navigateTo(page) {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity .25s ease';
  setTimeout(() => { window.location.href = page; }, 250);
}

// ==================== 全局命名空间 ====================
window.JiXiaoZhen = {
  apiBaseUrl: 'http://localhost:5000/api',
  initQuiz: null,
  initChat: null,
  initGame: null,
  loadNews: null
};
