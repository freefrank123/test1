import { apiGetQuiz } from "./api.js";

let questions = [];
let current = 0;
let score = 0;

export async function initQuiz() {
  questions = await apiGetQuiz();
  current = 0;
  score = 0;
  renderQuiz();
}

function renderQuiz() {
  if (current >= questions.length) {
    document.getElementById("quiz-title").innerText = `测验完成！得分：${score}/${questions.length}`;
    document.getElementById("quiz-options").innerHTML = "";
    document.getElementById("quiz-result").innerHTML = "";
    // 添加重新开始按钮
    document.getElementById("quiz-options").innerHTML = `<button onclick="initQuiz()">重新测验</button>`;
    return;
  }
  const q = questions[current];
  document.getElementById("quiz-title").innerText = (current+1)+". "+q.title;
  document.getElementById("quiz-options").innerHTML = q.options.map((opt,i) => 
    `<button onclick="chooseAnswer(${i})")">${opt}</button>`
  ).join("");
  document.getElementById("quiz-score").innerText = score;
  document.getElementById("quiz-result").innerHTML = "";
}

window.chooseAnswer = function(index) {
  const q = questions[current];
  const isCorrect = q.answer === index;
  
  if (isCorrect) score++;
  
  // 显示答案结果
  const resultElement = document.getElementById("quiz-result");
  const correctAnswer = q.options[q.answer];
  resultElement.innerHTML = `
    <div style="margin-top:10px; padding:10px; border-radius:8px; ${isCorrect ? 'background:#d4edda; color:#155724;' : 'background:#f8d7da; color:#721c24;'}">
      ${isCorrect ? '✓ 回答正确！' : '✗ 回答错误！'}<br>
      正确答案：${correctAnswer}
    </div>
  `;
  
  // 延迟进入下一题
  setTimeout(() => {
    current++;
    renderQuiz();
  }, 1500);
}