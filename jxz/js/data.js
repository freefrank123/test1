import { apiGetNews, apiGetEarthquakeData } from "./api.js";

// 显示地震新闻
export async function showNews() {
  try {
    const news = await apiGetNews();
    const newsContainer = document.getElementById("news-container");
    
    if (news.length === 0) {
      newsContainer.innerHTML = "<p>暂无地震新闻</p>";
      return;
    }
    
    newsContainer.innerHTML = news.map(item => `
      <div class="news-item">
        <h3>${item.location}发生${item.magnitude}级地震</h3>
        <p class="news-date">${item.time} | 震源深度：${item.depth || '未知'}</p>
        <p class="news-content">${item.content || '暂无详细信息'}</p>
      </div>
    `).join("");
  } catch (error) {
    console.error("显示新闻错误：", error);
    document.getElementById("news-container").innerHTML = "<p>加载新闻失败</p>";
  }
}

// 显示历史地震数据
export async function showEarthquakeData() {
  try {
    const data = await apiGetEarthquakeData();
    const dataContainer = document.getElementById("earthquake-container");
    
    if (data.length === 0) {
      dataContainer.innerHTML = "<p>暂无历史地震数据</p>";
      return;
    }
    
    dataContainer.innerHTML = `
      <table class="earthquake-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>地点</th>
            <th>震级</th>
            <th>深度</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(item => `
            <tr>
              <td>${item.time}</td>
              <td>${item.location}</td>
              <td>${item.magnitude}</td>
              <td>${item.depth}km</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error("显示地震数据错误：", error);
    document.getElementById("earthquake-container").innerHTML = "<p>加载地震数据失败</p>";
  }
}

// 初始化数据展示
export async function initDataDisplay() {
  // 可以在这里初始化数据展示
  console.log("数据展示模块初始化");
}import { apiGetNews, apiGetEarthquakeData } from "./api.js";

// 显示地震新闻
export async function showNews() {
  try {
    const news = await apiGetNews();
    const newsContainer = document.getElementById("news-container");
    
    if (news.length === 0) {
      newsContainer.innerHTML = "<p>暂无地震新闻</p>";
      return;
    }
    
    newsContainer.innerHTML = news.map(item => `
      <div class="news-item">
        <h3>${item.title}</h3>
        <p class="news-date">${item.date}</p>
        <p class="news-content">${item.content}</p>
      </div>
    `).join("");
  } catch (error) {
    console.error("显示新闻错误：", error);
    document.getElementById("news-container").innerHTML = "<p>加载新闻失败</p>";
  }
}

// 显示历史地震数据
export async function showEarthquakeData() {
  try {
    const data = await apiGetEarthquakeData();
    const dataContainer = document.getElementById("earthquake-container");
    
    if (data.length === 0) {
      dataContainer.innerHTML = "<p>暂无历史地震数据</p>";
      return;
    }
    
    dataContainer.innerHTML = `
      <table class="earthquake-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>地点</th>
            <th>震级</th>
            <th>深度</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(item => `
            <tr>
              <td>${item.time}</td>
              <td>${item.location}</td>
              <td>${item.magnitude}</td>
              <td>${item.depth}km</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error("显示地震数据错误：", error);
    document.getElementById("earthquake-container").innerHTML = "<p>加载地震数据失败</p>";
  }
}

// 初始化数据展示
export async function initDataDisplay() {
  // 可以在这里初始化数据展示
  console.log("数据展示模块初始化");
}