const { getSupabaseAdmin } = require('../middleware/auth.middleware');

function getAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase 未配置');
  return admin;
}

async function getProfile(userId) {
  try {
    const { data, error } = await getAdmin()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('获取个人资料失败:', error);
    return null;
  }
}

async function updateProfile(userId, updates) {
  try {
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
  } catch (error) {
    console.error('更新个人资料失败:', error);
    return null;
  }
}

async function addSearchHistory(userId, query, resultCount) {
  try {
    const { error } = await getAdmin()
      .from('search_history')
      .insert({
        user_id: userId,
        query: query || {},
        result_count: resultCount || 0
      });
    if (error) throw error;
  } catch (error) {
    console.error('保存搜索历史失败:', error);
  }
}

async function getSearchHistory(userId, limit = 20) {
  try {
    const { data, error } = await getAdmin()
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('searched_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    return [];
  }
}

async function addChatHistory(userId, userMessage, aiReply) {
  try {
    const { error } = await getAdmin()
      .from('chat_history')
      .insert({
        user_id: userId,
        user_message: userMessage,
        ai_reply: aiReply
      });
    if (error) throw error;
  } catch (error) {
    console.error('保存对话历史失败:', error);
  }
}

async function getChatHistory(userId, limit = 50) {
  try {
    const { data, error } = await getAdmin()
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('获取对话历史失败:', error);
    return [];
  }
}

const recentScores = new Map();

async function addTestScore(userId, score, totalQuestions) {
  try {
    const now = Date.now();
    const key = `${userId}:${score}`;
    const lastSaved = recentScores.get(key);
    
    if (lastSaved && (now - lastSaved) < 30000) {
      console.log(`⚠️ 跳过重复保存 - 用户ID: ${userId}, 分数: ${score}`);
      return null;
    }
    
    console.log(`保存测验分数 - 用户ID: ${userId}, 分数: ${score}`);
    
    const { data: result, error } = await getAdmin()
      .from('test_scores')
      .insert({
        user_id: userId,
        score: score,
        total_questions: totalQuestions,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    recentScores.set(key, now);
    setTimeout(() => recentScores.delete(key), 30000);
    
    return result;
  } catch (error) {
    console.error('保存测验分数失败:', error);
    throw error;
  }
}

async function getTestScores(userId, limit = 50) {
  try {
    console.log(`获取测验分数 - 用户ID: ${userId}`);
    
    const { data, error } = await getAdmin()
      .from('test_scores')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    console.log(`找到 ${data.length} 条测验记录`);

    return data.map(item => ({
      id: item.id,
      user_id: item.user_id,
      score: item.score,
      total_questions: item.total_questions,
      completed_at: item.completed_at
    }));
  } catch (error) {
    console.error('获取测验分数失败:', error);
    throw error;
  }
}

async function deleteAllTestScores(userId) {
  try {
    console.log(`删除所有测验分数 - 用户ID: ${userId}`);
    
    const { count, error } = await getAdmin()
      .from('test_scores')
      .delete()
      .eq('user_id', userId)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    console.log(`已删除 ${count} 条测验记录`);
    
    return count;
  } catch (error) {
    console.error('删除测验分数失败:', error);
    throw error;
  }
}

async function clearAllTestScores() {
  try {
    console.log('清除所有用户的测验分数');
    
    const { count, error } = await getAdmin()
      .from('test_scores')
      .delete()
      .neq('id', 0)
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    console.log(`已清除 ${count} 条测验记录`);
    
    return count;
  } catch (error) {
    console.error('清除测验分数失败:', error);
    throw error;
  }
}

async function getAllTestScores() {
  try {
    console.log('获取所有用户的测验分数');
    
    const { data, error } = await getAdmin()
      .from('test_scores')
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) throw error;
    console.log(`找到 ${data.length} 条测验记录`);
    
    return data;
  } catch (error) {
    console.error('获取所有测验分数失败:', error);
    throw error;
  }
}

async function deleteAccount(userId) {
  try {
    const { error } = await getAdmin().auth.admin.deleteUser(userId);
    if (error) throw error;
  } catch (error) {
    console.error('删除账户失败:', error);
    throw error;
  }
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
  getTestScores,
  deleteAllTestScores,
  clearAllTestScores,
  getAllTestScores
};