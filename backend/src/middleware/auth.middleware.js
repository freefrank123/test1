// 济小震 · Supabase JWT 认证中间件
const { createClient } = require('@supabase/supabase-js');

let supabaseAdmin = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || url === 'YOUR_SUPABASE_URL' || !key || key === 'YOUR_SUPABASE_SERVICE_ROLE_KEY') {
    console.warn('⚠️  Supabase 未配置，用户认证功能不可用。请在 .env 中设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  supabaseAdmin = createClient(url, key);
  console.log('✅ Supabase 已连接，用户认证已启用');
  return supabaseAdmin;
}

async function authMiddleware(req, res, next) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({
      success: false,
      message: '用户认证服务未配置'
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await admin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: '认证令牌无效或已过期'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('认证验证失败:', err);
    return res.status(500).json({
      success: false,
      message: '认证服务异常'
    });
  }
}

module.exports = { authMiddleware, getSupabaseAdmin };
