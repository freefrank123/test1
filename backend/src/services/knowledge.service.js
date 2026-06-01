// 济小震 · 知识文章服务（Supabase）
const { getSupabaseAdmin } = require('../middleware/auth.middleware');

function getAdmin() {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase 未配置');
  return admin;
}

const knowledgeService = {
  async getAllKnowledge() {
    const { data, error } = await getAdmin()
      .from('knowledge_articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getKnowledgeByCategory(category) {
    const { data, error } = await getAdmin()
      .from('knowledge_articles')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getKnowledgeById(id) {
    const { data, error } = await getAdmin()
      .from('knowledge_articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // 更新浏览量
    if (data) {
      await getAdmin()
        .from('knowledge_articles')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', id);
    }

    return data;
  },

  async searchKnowledge(keyword) {
    const { data, error } = await getAdmin()
      .from('knowledge_articles')
      .select('*')
      .or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%,keywords.ilike.%${keyword}%`)
      .order('view_count', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createKnowledge(data) {
    const { data: result, error } = await getAdmin()
      .from('knowledge_articles')
      .insert({
        title: data.title,
        category: data.category,
        author: data.author || null,
        source: data.source || null,
        keywords: data.keywords || null,
        summary: data.summary || null,
        content: data.content,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async updateKnowledge(id, data) {
    const { data: result, error } = await getAdmin()
      .from('knowledge_articles')
      .update({
        title: data.title,
        category: data.category,
        author: data.author || null,
        source: data.source || null,
        keywords: data.keywords || null,
        summary: data.summary || null,
        content: data.content,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async deleteKnowledge(id) {
    const { error } = await getAdmin()
      .from('knowledge_articles')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async getKnowledgeStats() {
    const cats = ['def', 'mag', 'firstaid', 'building'];
    const stats = { total: 0, categories: {} };

    for (const cat of cats) {
      const { count, error } = await getAdmin()
        .from('knowledge_articles')
        .select('*', { count: 'exact', head: true })
        .eq('category', cat);

      if (!error) {
        stats.categories[cat] = count;
        stats.total += count;
      } else {
        stats.categories[cat] = 0;
      }
    }

    return stats;
  }
};

module.exports = knowledgeService;
