-- ============================================
-- 济小震 · Supabase 数据库迁移脚本
-- 可安全重复执行
-- 在 Supabase Dashboard > SQL Editor 中执行
-- ============================================

-- 1. 用户资料表（扩展 auth.users）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. 地震搜索历史表
CREATE TABLE IF NOT EXISTS public.search_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  query JSONB NOT NULL DEFAULT '{}',
  result_count INTEGER DEFAULT 0,
  searched_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_searched_at ON public.search_history(searched_at DESC);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own search history" ON public.search_history;
CREATE POLICY "Users can read own search history" ON public.search_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own search history" ON public.search_history;
CREATE POLICY "Users can insert own search history" ON public.search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. AI 对话历史表
CREATE TABLE IF NOT EXISTS public.chat_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_reply TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at DESC);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own chat history" ON public.chat_history;
CREATE POLICY "Users can read own chat history" ON public.chat_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chat history" ON public.chat_history;
CREATE POLICY "Users can insert own chat history" ON public.chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. 知识文章表
CREATE TABLE IF NOT EXISTS public.knowledge_articles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('def', 'mag', 'firstaid', 'building')),
  author TEXT,
  source TEXT,
  keywords TEXT,
  summary TEXT,
  content TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_category ON public.knowledge_articles(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_created_at ON public.knowledge_articles(created_at DESC);

ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read knowledge" ON public.knowledge_articles;
CREATE POLICY "Anyone can read knowledge" ON public.knowledge_articles
  FOR SELECT USING (true);

-- 6. 测试积分表
CREATE TABLE IF NOT EXISTS public.test_scores (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_test_scores_user_id ON public.test_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_test_scores_completed_at ON public.test_scores(completed_at DESC);

ALTER TABLE public.test_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own scores" ON public.test_scores;
CREATE POLICY "Users can read own scores" ON public.test_scores
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own scores" ON public.test_scores;
CREATE POLICY "Users can insert own scores" ON public.test_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. 测验结果详情表
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id INTEGER NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  correct_count INTEGER DEFAULT 0 CHECK (correct_count >= 0),
  answers JSONB,
  accuracy FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON public.quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at ON public.quiz_results(created_at DESC);

ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own quiz results" ON public.quiz_results;
CREATE POLICY "Users can read own quiz results" ON public.quiz_results
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own quiz results" ON public.quiz_results;
CREATE POLICY "Users can insert own quiz results" ON public.quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
