// 济小震 · 主入口模块
(function() {
  // 等待DOM加载完成
  document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ 济小震应用已加载');

    // 根据当前页面初始化对应的模块
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    switch(currentPage) {
      case 'knowledge.html':
        // 初始化测验模块
        if (window.JiXiaoZhen && window.JiXiaoZhen.Quiz) {
          window.JiXiaoZhen.Quiz.init();
        }
        break;

      case 'emergency.html':
        // 初始化聊天模块
        if (window.JiXiaoZhen && window.JiXiaoZhen.Chat) {
          window.JiXiaoZhen.Chat.init();
        }
        break;

      case 'game.html':
        // 初始化游戏模块
        if (window.JiXiaoZhen && window.JiXiaoZhen.Game) {
          window.JiXiaoZhen.Game.init();
        }
        break;

      case 'news.html':
        // 初始化数据展示模块
        if (window.JiXiaoZhen && window.JiXiaoZhen.Data) {
          window.JiXiaoZhen.Data.init();
        }
        break;

      default:
        // 首页不需要特殊初始化
        console.log('首页加载完成');
    }
  });
})();