-- 數據庫遷移：添加排行榜統計字段

-- 添加閱讀計數
ALTER TABLE stories ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 添加分享計數
ALTER TABLE stories ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- 創建視圖：今日熱門故事
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

-- 創建視圖：本週熱門故事
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

-- 每日統計表（用於趨勢分析）
CREATE TABLE IF NOT EXISTS daily_story_stats (
  id SERIAL PRIMARY KEY,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(story_id, date)
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_stories_view_count ON stories(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_stories_share_count ON stories(share_count DESC);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_story_stats(date);
