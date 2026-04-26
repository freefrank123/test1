import { initChat } from "./chat.js";
import { initQuiz } from "./dt.js";
import { initGame } from "./game.js";
import { initDataDisplay, showNews, showEarthquakeData } from "./data.js";

// 初始化所有功能
window.onload = () => {
  console.log("✅ 济小震应用已加载");
  
  // 初始化各个模块
  initDataDisplay();
  
  // 暴露全局函数
  window.initQuiz = initQuiz;
  window.initGame = initGame;
  window.showNews = showNews;
  window.showEarthquakeData = showEarthquakeData;
};

// 初始化聊天功能
export function initChatModule() {
  initChat();
  console.log("✅ 济小震AI对话已启动");
}