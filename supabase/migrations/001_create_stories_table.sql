-- ============================================================
-- NyxAI 數據庫設置 - 完整 SQL
-- 執行此文件創建所有必要的表和視圖
-- ============================================================

-- 1. 創建 stories 表（核心故事表）
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  short_id VARCHAR(10) UNIQUE,
  template_id TEXT,
  template_name TEXT,
  is_public BOOLEAN DEFAULT true,
  word_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 啟用 RLS（行級安全）
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- 3. 創建 RLS 策略
-- 允許任何人閱讀公開故事
CREATE POLICY "Allow public read" ON stories
  FOR SELECT USING (is_public = true);

-- 允許創建者讀取自己的故事
CREATE POLICY "Allow owner read" ON stories
  FOR SELECT USING (auth.uid() = user_id);

-- 允許創建者插入
CREATE POLICY "Allow owner insert" ON stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允許創建者更新
CREATE POLICY "Allow owner update" ON stories
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. 創建索引（優化查詢性能）
CREATE INDEX IF NOT EXISTS idx_stories_short_id ON stories(short_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_view_count ON stories(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_stories_share_count ON stories(share_count DESC);
CREATE INDEX IF NOT EXISTS idx_stories_is_public ON stories(is_public);

-- 5. 創建每日統計表（用於趨勢分析）
CREATE TABLE IF NOT EXISTS daily_story_stats (
  id SERIAL PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, date)
);

-- 6. 創建視圖：今日熱門故事
CREATE OR REPLACE VIEW trending_stories_today AS
SELECT 
  id,
  title,
  content,
  short_id,
  template_name,
  view_count,
  share_count,
  (view_count + share_count * 3) as trending_score,
  created_at
FROM stories
WHERE is_public = true
  AND created_at >= CURRENT_DATE - INTERVAL '1 day'
ORDER BY trending_score DESC
LIMIT 20;

-- 7. 創建視圖：本週熱門故事
CREATE OR REPLACE VIEW trending_stories_week AS
SELECT 
  id,
  title,
  content,
  short_id,
  template_name,
  view_count,
  share_count,
  (view_count + share_count * 3) as trending_score,
  created_at
FROM stories
WHERE is_public = true
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY trending_score DESC
LIMIT 20;

-- 8. 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_stories_updated_at ON stories;
CREATE TRIGGER update_stories_updated_at
  BEFORE UPDATE ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
