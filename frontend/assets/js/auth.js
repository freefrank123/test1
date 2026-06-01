// 济小震 · 用户认证模块（基于 Supabase Auth）
(function () {
  const config = window.SUPABASE_CONFIG;
  if (!config || !config.url || config.url === 'YOUR_SUPABASE_URL') {
    console.warn('⚠ Supabase 未配置，认证功能不可用。请修改 config.js');
    window.JiXiaoZhen = window.JiXiaoZhen || {};
    window.JiXiaoZhen.Auth = { enabled: false };
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('❌ Supabase CDN 未加载，请检查网络连接');
    window.JiXiaoZhen = window.JiXiaoZhen || {};
    window.JiXiaoZhen.Auth = { enabled: false };
    return;
  }

  let supabase;
  try {
    supabase = window.supabase.createClient(config.url, config.anonKey);
    console.log('✅ Supabase 客户端初始化成功');
  } catch (err) {
    console.error('❌ Supabase 客户端初始化失败:', err.message);
    window.JiXiaoZhen = window.JiXiaoZhen || {};
    window.JiXiaoZhen.Auth = { enabled: false };
    return;
  }

  window.JiXiaoZhen = window.JiXiaoZhen || {};
  window.JiXiaoZhen.Supabase = supabase;

  // ==================== 会话管理 ====================

  async function getSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (err) {
      console.error('获取会话失败:', err);
      return null;
    }
  }

  async function getUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (err) {
      console.error('获取用户失败:', err);
      return null;
    }
  }

  // ==================== 认证操作 ====================

  async function signUp(email, password) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) console.error('注册失败:', error.message);
      return { data, error };
    } catch (err) {
      console.error('注册异常:', err);
      return { data: null, error: err };
    }
  }

  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) console.error('登录失败:', error.message);
      return { data, error };
    } catch (err) {
      console.error('登录异常:', err);
      return { data: null, error: err };
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      console.error('退出失败:', err);
      return { error: err };
    }
  }

  // ==================== JWT 获取（供 API 调用使用） ====================

  async function getAccessToken() {
    const session = await getSession();
    return session?.access_token || null;
  }

  // ==================== 导航栏用户区域渲染 ====================

  async function updateNavbar() {
    const userArea = document.getElementById('userArea');
    if (!userArea) return;

    const session = await getSession();

    if (session && session.user) {
      const user = session.user;
      const metadata = user.user_metadata || {};
      const avatarUrl = metadata.avatar_url || null;
      const nickname = metadata.nickname || (user.email ? user.email.split('@')[0] : '用户');
      const email = user.email || '';
      const initial = nickname.charAt(0).toUpperCase();

      userArea.innerHTML = `
        <div class="user-menu" id="userMenu">
          <div class="user-avatar" id="userAvatar" title="${escapeHtml(nickname)}">
            ${avatarUrl
              ? `<img src="${escapeHtml(avatarUrl)}" alt="avatar">`
              : `<span class="avatar-placeholder">${escapeHtml(initial)}</span>`
            }
          </div>
          <div class="user-dropdown" id="userDropdown">
            <div class="dropdown-header">
              <span class="dropdown-name">${escapeHtml(nickname)}</span>
              <span class="dropdown-email">${escapeHtml(email)}</span>
            </div>
            <a href="profile.html"><i class="fas fa-user"></i> 个人主页</a>
            <a href="admin.html"><i class="fas fa-pen-to-square"></i> 知识管理</a>
            <a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> 退出登录</a>
            <div style="border-top:1px solid var(--border-subtle);margin:.3rem 0;"></div>
            <a href="#" id="deleteAccountNav" style="color:#ef4444;"><i class="fas fa-trash"></i> 注销账户</a>
          </div>
        </div>
      `;

      document.getElementById('userAvatar').addEventListener('click', function (e) {
        e.stopPropagation();
        document.getElementById('userDropdown').classList.toggle('show');
      });

      document.getElementById('logoutBtn').addEventListener('click', async function (e) {
        e.preventDefault();
        await signOut();
        window.location.reload();
      });

      document.getElementById('deleteAccountNav').addEventListener('click', async function (e) {
        e.preventDefault();
        if (!confirm('确定要注销账户吗？所有数据将被永久删除。')) return;
        if (!confirm('再次确认：真的要注销账户吗？此操作不可撤销。')) return;
        try {
          const user = window.JiXiaoZhen?.User;
          if (user) await user.deleteAccount();
        } catch (err) {
          alert('注销失败：' + (err.message || '未知错误'));
        }
      });

      document.addEventListener('click', function () {
        const dd = document.getElementById('userDropdown');
        if (dd) dd.classList.remove('show');
      });
    } else {
      userArea.innerHTML = `
        <a href="login.html" class="btn-login">
          <i class="fas fa-user"></i> 登录
        </a>
      `;
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== 认证状态监听 ====================

  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 认证状态变化:', event);
    updateNavbar();
  });

  // ==================== 页面初始化 ====================

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavbar);
  } else {
    updateNavbar();
  }

  // ==================== 暴露到全局 ====================

  window.JiXiaoZhen.Auth = {
    enabled: true,
    supabase,
    getSession,
    getUser,
    signUp,
    signIn,
    signOut,
    getAccessToken,
    updateNavbar
  };
})();
