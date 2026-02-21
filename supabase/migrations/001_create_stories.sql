-- NyxAI Stories Table Migration
-- 請在 Supabase Dashboard > SQL Editor 中執行

-- 1. 建立 stories 表
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT '新故事',
  content TEXT NOT NULL DEFAULT '',
  topics JSONB DEFAULT '[]'::jsonb,
  roles JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT false,
  share_id UUID UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 啟用 RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- 3. 建立 RLS 政策
-- 用戶只能讀自己的故事
CREATE POLICY "Users can read own stories" ON public.stories
  FOR SELECT
  USING (auth.uid() = user_id);

-- 用戶只能建立自己的故事
CREATE POLICY "Users can insert own stories" ON public.stories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用戶只能更新自己的故事
CREATE POLICY "Users can update own stories" ON public.stories
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 用戶只能刪除自己的故事
CREATE POLICY "Users can delete own stories" ON public.stories
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. 建立索引
CREATE INDEX IF NOT EXISTS idx_stories_user_created 
  ON public.stories (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stories_share_id 
  ON public.stories (share_id) WHERE is_public = true;

-- 5. 設定預設權限（讓 auth.users 可以被 stories 參考）
ALTER TABLE public.stories 
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 6. 啟用 Realtime（可選）
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;

COMMENT ON TABLE public.stories IS 'NyxAI 用戶創作的故事儲存';
