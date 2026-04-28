// 王紫晗编写：导航栏高亮 + 主题切换 + 页面跳转辅助
document.addEventListener('DOMContentLoaded', function() {
    // 1. 导航栏高亮逻辑
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath) {
            link.classList.add('active');
        }
    });

    // 2. 主题切换逻辑（持久化存储）
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;
    
    // 初始化主题
    const savedTheme = localStorage.getItem('jxz-theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // 主题切换事件
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = htmlElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('jxz-theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    // 更新主题图标
    function updateThemeIcon(theme) {
        if (!themeToggle) return;
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
});

// 页面跳转辅助
function navigateTo(page) {
    window.location.href = page;
}

// 预留全局命名空间，供高子宣、韩佳呈使用
window.JiXiaoZhen = {
    apiBaseUrl: 'http://localhost:5000/api',
    initQuiz: null,
    initChat: null,
    initGame: null,
    loadNews: null
};