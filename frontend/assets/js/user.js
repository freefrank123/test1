// 济小震 · 用户数据模块（个人资料 / 搜索历史 / 对话历史 / 测试积分）
(function () {
  const BASE = window.JiXiaoZhen?.apiBaseUrl || 'http://localhost:5000/api';

  // ==================== HTTP 辅助 ====================

  async function authFetch(url, options = {}) {
    const auth = window.JiXiaoZhen?.Auth;
    const token = auth?.enabled ? await auth.getAccessToken() : null;

    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || '请求失败');
    return data;
  }

  // ==================== 个人资料 ====================

  async function getProfile() {
    try {
      const data = await authFetch(`${BASE}/user/profile`);
      return data.data || null;
    } catch (err) {
      console.error('获取个人资料失败:', err);
      return null;
    }
  }

  async function updateProfile(updates) {
    try {
      const data = await authFetch(`${BASE}/user/profile`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return data.data || null;
    } catch (err) {
      console.error('更新个人资料失败:', err);
      return null;
    }
  }

  // ==================== 注销账户 ====================

  async function deleteAccount() {
    try {
      await authFetch(`${BASE}/user/account`, { method: 'DELETE' });
      const auth = window.JiXiaoZhen?.Auth;
      if (auth?.enabled) await auth.signOut();
      window.location.href = 'index.html';
    } catch (err) {
      console.error('注销账户失败:', err);
      throw err;
    }
  }

  // ==================== 地震搜索历史 ====================

  async function saveSearchHistory(query, resultCount) {
    try {
      await authFetch(`${BASE}/user/search-history`, {
        method: 'POST',
        body: JSON.stringify({ query, resultCount })
      });
    } catch (err) {
      // 静默失败
    }
  }

  async function getSearchHistory(limit = 20) {
    try {
      const data = await authFetch(`${BASE}/user/search-history?limit=${limit}`);
      return data.data || [];
    } catch (err) {
      console.error('获取搜索历史失败:', err);
      return [];
    }
  }

  // ==================== AI 对话历史 ====================

  async function saveChatHistory(userMessage, aiReply) {
    try {
      await authFetch(`${BASE}/user/chat-history`, {
        method: 'POST',
        body: JSON.stringify({ userMessage, aiReply })
      });
    } catch (err) {
      // 静默失败
    }
  }

  async function getChatHistory(limit = 50) {
    try {
      const data = await authFetch(`${BASE}/user/chat-history?limit=${limit}`);
      return data.data || [];
    } catch (err) {
      console.error('获取对话历史失败:', err);
      return [];
    }
  }

  // ==================== 测试积分 ====================

  async function saveTestScore(score, totalQuestions) {
    try {
      const data = await authFetch(`${BASE}/user/scores`, {
        method: 'POST',
        body: JSON.stringify({ score, totalQuestions })
      });
      return data.data || null;
    } catch (err) {
      console.error('保存测试积分失败:', err);
      return null;
    }
  }

  async function getTestScores(limit = 50) {
    try {
      const data = await authFetch(`${BASE}/user/scores?limit=${limit}`);
      return data.data || [];
    } catch (err) {
      console.error('获取测试积分失败:', err);
      return [];
    }
  }

  // ==================== 暴露到全局 ====================

  window.JiXiaoZhen.User = {
    getProfile,
    updateProfile,
    deleteAccount,
    saveSearchHistory,
    getSearchHistory,
    saveChatHistory,
    getChatHistory,
    saveTestScore,
    getTestScores
  };
})();
