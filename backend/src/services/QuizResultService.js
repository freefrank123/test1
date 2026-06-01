// 济小震 · 测验结果服务（Supabase）
const { getSupabaseAdmin } = require('../middleware/auth.middleware');

function getAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase 未配置');
  return admin;
}

class QuizResultService {
  static async createQuizResult(data) {
    const { userId, quizId, score, totalQuestions, correctCount, answers } = data;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 10000) / 100 : 0;

    const { data: result, error } = await getAdmin()
      .from('quiz_results')
      .insert({
        user_id: userId,
        quiz_id: quizId,
        score,
        total_questions: totalQuestions,
        correct_count: correctCount || 0,
        answers: answers || {},
        accuracy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async getQuizResultsByUserId(userId, page = 1, limit = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { count, error: countErr } = await getAdmin()
      .from('quiz_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countErr) throw countErr;

    const { data, error } = await getAdmin()
      .from('quiz_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const results = (data || []).map((row, index) => ({
      ...row,
      serialNumber: from + index + 1
    }));

    return {
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
      currentPage: page,
      results
    };
  }

  static async getQuizResultById(id) {
    const { data, error } = await getAdmin()
      .from('quiz_results')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserQuizStats(userId) {
    const { data, error } = await getAdmin()
      .from('quiz_results')
      .select('score, correct_count, total_questions, accuracy')
      .eq('user_id', userId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { totalQuizzes: 0, totalScore: 0, totalCorrect: 0, totalQuestions: 0, avgAccuracy: 0 };
    }

    const totalQuizzes = data.length;
    const totalScore = data.reduce((s, r) => s + (r.score || 0), 0);
    const totalCorrect = data.reduce((s, r) => s + (r.correct_count || 0), 0);
    const totalQuestions = data.reduce((s, r) => s + (r.total_questions || 0), 0);
    const avgAccuracy = totalQuizzes > 0
      ? Math.round(data.reduce((s, r) => s + (r.accuracy || 0), 0) / totalQuizzes * 100) / 100
      : 0;

    return { totalQuizzes, totalScore, totalCorrect, totalQuestions, avgAccuracy };
  }

  static async deleteQuizResult(id, userId) {
    const { data: existing } = await getAdmin()
      .from('quiz_results')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existing) return null;

    const { error } = await getAdmin()
      .from('quiz_results')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return existing;
  }
}

module.exports = QuizResultService;
