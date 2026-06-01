const { createClient } = require('@supabase/supabase-js');
let supabaseAdmin = null;

function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || url === 'YOUR_SUPABASE_URL' || !key || key === 'YOUR_SUPABASE_SERVICE_ROLE_KEY') {
    console.warn('⚠️ Supabase 未配置，用户认证功能不可用。请在 .env 中设置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }
  supabaseAdmin = createClient(url, key);
  console.log('✓ Supabase 已连接，用户认证已启用');
  return supabaseAdmin;
}

function getNumericUserId(uuid) {
  if (!uuid) return 1;
  const hash = uuid.split('-').join('');
  const num = parseInt(hash.slice(0, 8), 16);
  return num % 1000000 + 1;
}

async function authMiddleware(req, res, next) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    console.log('⚠️ Supabase 不可用，使用模拟用户ID');
    req.user = { id: 'default-user-uuid-for-testing' };
    return next();
  }
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('⚠️ 未提供认证令牌，使用模拟用户ID');
    req.user = { id: 'default-user-uuid-for-testing' };
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) {
      console.log('⚠️ 认证令牌无效，使用模拟用户ID');
      req.user = { id: 'default-user-uuid-for-testing' };
      return next();
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('认证验证失败:', err);
    console.log('⚠️ 使用模拟用户ID');
    req.user = { id: 'default-user-uuid-for-testing' };
    next();
  }
}

module.exports = { authMiddleware, getSupabaseAdmin, getNumericUserId };