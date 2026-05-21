// 济小震 · 用户数据服务
const { getSupabaseAdmin } = require('../middleware/auth.middleware');

function getAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase 未配置');
  return admin;
}

// ==================== 个人资料 ====================

async function getProfile(userId) {
  const { data, error } = await getAdmin()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function updateProfile(userId, updates) {
  const allowed = {};

  if (updates.nickname !== undefined) allowed.nickname = updates.nickname;
  if (updates.avatar_url !== undefined) allowed.avatar_url = updates.avatar_url;
  if (updates.phone !== undefined) allowed.phone = updates.phone;

  allowed.updated_at = new Date().toISOString();

  const { data, error } = await getAdmin()
    .from('profiles')
    .upsert({ id: userId, ...allowed }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ==================== 搜索历史 ====================

async function addSearchHistory(userId, query, resultCount) {
  const { error } = await getAdmin()
    .from('search_history')
    .insert({
      user_id: userId,
      query: query || {},
      result_count: resultCount || 0
    });

  if (error) throw error;
}

async function getSearchHistory(userId, limit = 20) {
  const { data, error } = await getAdmin()
    .from('search_history')
    .select('*')
    .eq('user_id', userId)
    .order('searched_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// ==================== 对话历史 ====================

async function addChatHistory(userId, userMessage, aiReply) {
  const { error } = await getAdmin()
    .from('chat_history')
    .insert({
      user_id: userId,
      user_message: userMessage,
      ai_reply: aiReply
    });

  if (error) throw error;
}

async function getChatHistory(userId, limit = 50) {
  const { data, error } = await getAdmin()
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// ==================== 测试积分 ====================

async function addTestScore(userId, score, totalQuestions) {
  const { data, error } = await getAdmin()
    .from('test_scores')
    .insert({
      user_id: userId,
      score: score,
      total_questions: totalQuestions
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getTestScores(userId, limit = 50) {
  const { data, error } = await getAdmin()
    .from('test_scores')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// ==================== 注销账户 ====================

async function deleteAccount(userId) {
  const { error } = await getAdmin().auth.admin.deleteUser(userId);
  if (error) throw error;
  // profiles / history / scores 由 ON DELETE CASCADE 自动删除
}

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
  addSearchHistory,
  getSearchHistory,
  addChatHistory,
  getChatHistory,
  addTestScore,
  getTestScores
};
