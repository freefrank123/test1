const { getSupabaseAdmin, getNumericUserId } = require('../middleware/auth.middleware');
const { QuizResult, User } = require('../models');

function getAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase 未配置');
  return admin;
}

// ==================== 个人资料 ====================
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

// ==================== 搜索历史 ====================
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

// ==================== 对话历史 ====================
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

// ==================== 测验分数（从MySQL读取，不依赖Supabase） ====================
async function addTestScore(userId, score, totalQuestions) {
  try {
    const numericUserId = getNumericUserId(userId);
    console.log(`保存测验分数 - 用户ID: ${userId}, 数字ID: ${numericUserId}, 分数: ${score}`);
    
    await User.findOrCreate({
      where: { id: numericUserId },
      defaults: {
        nickname: '用户',
        score: 0,
        quizCount: 0,
        correctCount: 0
      }
    });

    const result = await QuizResult.create({
      userId: numericUserId,
      quizId: 1,
      score: score,
      totalQuestions: totalQuestions,
      correctCount: Math.round(score / 10),
      accuracy: Math.round((score / (totalQuestions * 10)) * 100)
    });
    
    await User.increment({
      score: score,
      quizCount: 1,
      correctCount: Math.round(score / 10)
    }, {
      where: { id: numericUserId }
    });

    return result.toJSON();
  } catch (error) {
    console.error('保存测验分数失败:', error);
    throw error;
  }
}

async function getTestScores(userId, limit = 50) {
  try {
    const numericUserId = getNumericUserId(userId);
    console.log(`获取测验分数 - 用户ID: ${userId}, 数字ID: ${numericUserId}`);
    
    const results = await QuizResult.findAll({
      where: { userId: numericUserId },
      order: [['createdAt', 'DESC']],
      limit: limit
    });
    
    console.log(`找到 ${results.length} 条测验记录`);
    
    return results.map(result => {
      const data = result.toJSON();
      return {
        id: data.id,
        user_id: userId,
        score: data.score,
        total_questions: data.totalQuestions,
        completed_at: data.createdAt
      };
    });
  } catch (error) {
    console.error('获取测验分数失败:', error);
    throw error;
  }
}

// ==================== 删除账户 ====================
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
  getTestScores
};