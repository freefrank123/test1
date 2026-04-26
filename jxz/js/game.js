let count = 0;
let isShaking = false;

export function initGame() {
  count = 0;
  isShaking = false;
  document.getElementById("game-result").innerText = "点击'搭建房屋'开始游戏";
  document.getElementById("building-container").innerHTML = "";
}

export function build() {
  if (isShaking) return;
  
  count++;
  const buildingContainer = document.getElementById("building-container");
  
  // 创建新的楼层
  const floor = document.createElement("div");
  floor.className = "building-floor";
  floor.style.width = `${Math.max(100 - count * 10, 50)}px`;
  floor.style.marginTop = "5px";
  buildingContainer.appendChild(floor);
  
  document.getElementById("game-result").innerText = `已搭建：${count} 层`;
}

export function shake() {
  if (isShaking) return;
  
  isShaking = true;
  const buildingContainer = document.getElementById("building-container");
  const resultElement = document.getElementById("game-result");
  
  // 添加震动动画
  buildingContainer.classList.add("shaking");
  
  // 延迟判断结果
  setTimeout(() => {
    buildingContainer.classList.remove("shaking");
    isShaking = false;
    
    if (count >= 3) {
      resultElement.innerText = "房屋稳固，抗震合格！";
      resultElement.style.color = "#28a745";
    } else if (count >= 1) {
      resultElement.innerText = "房屋不够稳固，需要继续加固！";
      resultElement.style.color = "#ffc107";
    } else {
      resultElement.innerText = "请先搭建房屋！";
      resultElement.style.color = "#dc3545";
    }
  }, 2000);
}

window.build = build;
window.shake = shake;
window.initGame = initGame;