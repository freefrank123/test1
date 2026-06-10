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

function getAnonId(req) {
  const ip = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || 'unknown').toString().split(',')[0].trim();
  const ua = (req.headers['user-agent'] || '').substring(0, 50);
  const raw = `anon-${ip}-${ua}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  return `anon-${Math.abs(hash).toString(36)}`;
}

async function authMiddleware(req, res, next) {
  const admin = getSupabaseAdmin();
  
  const authHeader = req.headers.authorization;
  const hasToken = authHeader && authHeader.startsWith('Bearer ');
  
  if (!admin) {
    req.user = { id: getAnonId(req), anonymous: true };
    return next();
  }
  
  if (!hasToken) {
    req.user = { id: getAnonId(req), anonymous: true };
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (error || !user) {
      console.warn('认证令牌无效，回退到匿名用户');
      req.user = { id: getAnonId(req), anonymous: true };
      return next();
    }
    req.user = user;
    next();
  } catch (err) {
    console.warn('认证验证异常，回退到匿名用户:', err.message);
    req.user = { id: getAnonId(req), anonymous: true };
    next();
  }
}

module.exports = { authMiddleware, getSupabaseAdmin };