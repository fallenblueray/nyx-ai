-- Migration 002: 匿名用戶使用追蹤 + 用戶偏好記憶層
-- 執行於 Supabase Dashboard > SQL Editor

-- ============================
-- 1. 匿名用戶使用追蹤表
-- ============================
CREATE TABLE IF NOT EXISTS public.anonymous_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id TEXT UNIQUE NOT NULL,        -- 前端生成的匿名 ID (UUID v4)
  words_used INTEGER NOT NULL DEFAULT 0,    -- 已用字數
  words_limit INTEGER NOT NULL DEFAULT 8000, -- 免費額度
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 為匿名 ID 建立索引
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_id 
  ON public.anonymous_usage (anonymous_id);

-- RLS: 完全由 service_role 管理（不允許前端直接讀寫）
ALTER TABLE public.anonymous_usage ENABLE ROW LEVEL SECURITY;

-- 不允許任何 authenticated/anon 角色直接存取
-- 只透過 API route (service_role) 操作
CREATE POLICY "No direct access to anonymous_usage" ON public.anonymous_usage
  FOR ALL USING (false);

-- ============================
-- 2. 用戶偏好記憶表（記憶層核心）
-- ============================
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 風格偏好（從歷史生成中自動學習）
  preferred_styles JSONB DEFAULT '[]'::jsonb,   -- ["romantic", "dark", "action"]
  preferred_topics JSONB DEFAULT '[]'::jsonb,   -- [{"category":"...", "item":"..."}]
  preferred_word_length INTEGER DEFAULT 1000,   -- 平均喜好字數
  
  -- 角色偏好（常用角色設定）
  saved_characters JSONB DEFAULT '[]'::jsonb,   -- 常用角色卡
  
  -- 寫作風格分析（自動從生成歷史提取）
  writing_style_notes TEXT DEFAULT '',          -- 未來可用 LLM 分析
  
  -- 統計
  total_stories_generated INTEGER DEFAULT 0,
  total_words_generated INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- service_role (API) 可以 insert/update
CREATE POLICY "Service role full access to preferences" ON public.user_preferences
  FOR ALL USING (true);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id 
  ON public.user_preferences (user_id);

-- ============================
-- 3. 自動更新 updated_at
-- ============================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_anonymous_usage_updated_at
  BEFORE UPDATE ON public.anonymous_usage
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

COMMENT ON TABLE public.anonymous_usage IS '匿名訪客的免費字數使用追蹤';
COMMENT ON TABLE public.user_preferences IS '用戶偏好記憶層 - 類 Agent 學習系統';
