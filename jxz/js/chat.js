import { getAIAnswer } from "./api.js";

let chatBox;
let inputBox;

export function initChat() {
  chatBox = document.getElementById("chat-box");
  inputBox = document.getElementById("chat-input");
}

// 发送消息
export async function sendMsg() {
  const text = inputBox.value.trim();
  if (!text) return;

  // 显示用户消息
  addMsg(text, "user");
  inputBox.value = "";

  // 显示加载中
  addLoading();

  // 调用AI
  const aiReply = await getAIAnswer(text);

  // 移除加载，显示AI回答
  removeLoading();
  addMsg(aiReply, "bot");
}

// 添加消息到界面
function addMsg(text, role) {
  const div = document.createElement("div");
  div.className = `msg msg-${role}`;
  div.innerText = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 加载动画
function addLoading() {
  const loadDiv = document.createElement("div");
  loadDiv.id = "loading";
  loadDiv.className = "msg msg-bot loading";
  loadDiv.innerText = "济小震思考中...";
  chatBox.appendChild(loadDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeLoading() {
  const loading = document.getElementById("loading");
  if (loading) loading.remove();
}

// 清空对话
export function clearChat() {
  chatBox.innerHTML = "";
}

// 暴露给HTML点击
window.sendMsg = sendMsg;
window.clearChat = clearChat;