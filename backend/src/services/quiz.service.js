const { getSupabaseAdmin } = require('../middleware/auth.middleware');

function getAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase 未配置');
  return admin;
}

class QuizService {
  async getQuizList(limit = 10, shuffle = false) {
    let query = getAdmin()
      .from('quizzes')
      .select('id, title, options, answer, explanation')
      .limit(parseInt(limit));

    if (shuffle) {
      query = query.order('id', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async checkAnswer(quizId, userAnswer) {
    const { data: quiz, error } = await getAdmin()
      .from('quizzes')
      .select('answer, explanation')
      .eq('id', parseInt(quizId))
      .single();

    if (error) throw error;
    if (!quiz) throw new Error('题目不存在');

    const correct = parseInt(userAnswer) === quiz.answer;

    return {
      correct,
      correctAnswer: quiz.answer,
      explanation: quiz.explanation
    };
  }

  async getRandomQuiz() {
    const { count, error: countErr } = await getAdmin()
      .from('quizzes')
      .select('*', { count: 'exact', head: true });

    if (countErr) throw countErr;
    if (count === 0) return null;

    const offset = Math.floor(Math.random() * count);
    const { data, error } = await getAdmin()
      .from('quizzes')
      .select('id, title, options, answer, explanation')
      .range(offset, offset);

    if (error) throw error;
    return data[0] || null;
  }

  async getQuizById(id) {
    const { data, error } = await getAdmin()
      .from('quizzes')
      .select('id, title, options, answer, explanation')
      .eq('id', parseInt(id))
      .single();

    if (error) throw error;
    return data;
  }

  async createQuiz(quizData) {
    const { data: result, error } = await getAdmin()
      .from('quizzes')
      .insert({
        title: quizData.title,
        options: quizData.options,
        answer: quizData.answer,
        explanation: quizData.explanation,
        category: quizData.category || 'earthquake',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateQuiz(id, quizData) {
    const { data: result, error } = await getAdmin()
      .from('quizzes')
      .update({
        title: quizData.title,
        options: quizData.options,
        answer: quizData.answer,
        explanation: quizData.explanation,
        category: quizData.category || 'earthquake',
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;
    if (!result) throw new Error('题目不存在');
    return result;
  }

  async deleteQuiz(id) {
    const { data: result, error } = await getAdmin()
      .from('quizzes')
      .delete()
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;
    if (!result) throw new Error('题目不存在');
    return result;
  }

  async getQuizCount() {
    const { count, error } = await getAdmin()
      .from('quizzes')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }
}

module.exports = new QuizService();