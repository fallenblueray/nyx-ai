-- NyxAI Phase 7: Trending & Favorites
-- 創建時間: 2026-03-06
-- 功能: 模板使用統計 + 用戶收藏

-- ============================================
-- 1. 模板使用統計表
-- ============================================
CREATE TABLE IF NOT EXISTS template_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  word_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引: 按模板查詢
CREATE INDEX IF NOT EXISTS idx_template_usage_template_id 
  ON template_usage_stats(template_id);

-- 索引: 按時間查詢（用於 Trending 計算）
CREATE INDEX IF NOT EXISTS idx_template_usage_time 
  ON template_usage_stats(used_at DESC);

-- 索引: 按用戶查詢
CREATE INDEX IF NOT EXISTS idx_template_usage_user 
  ON template_usage_stats(user_id) 
  WHERE user_id IS NOT NULL;

-- ============================================
-- 2. 用戶模板收藏表
-- ============================================
CREATE TABLE IF NOT EXISTS user_template_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 確保同一用戶不能重複收藏同一模板
  UNIQUE(user_id, template_id)
);

-- 索引: 按用戶查詢收藏
CREATE INDEX IF NOT EXISTS idx_user_favorites_user 
  ON user_template_favorites(user_id);

-- 索引: 按模板查詢被收藏次數
CREATE INDEX IF NOT EXISTS idx_user_favorites_template 
  ON user_template_favorites(template_id);

-- ============================================
-- 3. Trending 視圖（24小時熱門）
-- ============================================
CREATE OR REPLACE VIEW trending_templates AS
SELECT 
  template_id,
  COUNT(*) as usage_count_24h,
  MAX(used_at) as last_used
FROM template_usage_stats
WHERE used_at > NOW() - INTERVAL '24 hours'
GROUP BY template_id
ORDER BY usage_count_24h DESC;

-- ============================================
-- 4. RLS 權限設置
-- ============================================

-- template_usage_stats: 僅允許系統寫入，用戶只能讀取自己的記錄
ALTER TABLE template_usage_stats ENABLE ROW LEVEL SECURITY;

-- 用戶只能看到自己的使用記錄（匿名用戶看不到）
CREATE POLICY "Users can view own usage stats" 
  ON template_usage_stats FOR SELECT
  USING (user_id = auth.uid());

-- user_template_favorites: 用戶只能操作自己的收藏
ALTER TABLE user_template_favorites ENABLE ROW LEVEL SECURITY;

-- 用戶只能查看自己的收藏
CREATE POLICY "Users can view own favorites" 
  ON user_template_favorites FOR SELECT
  USING (user_id = auth.uid());

-- 用戶只能插入自己的收藏
CREATE POLICY "Users can add own favorites" 
  ON user_template_favorites FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 用戶只能刪除自己的收藏
CREATE POLICY "Users can delete own favorites" 
  ON user_template_favorites FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 5. 註釋說明
-- ============================================
COMMENT ON TABLE template_usage_stats IS '模板使用統計，用於計算 Trending';
COMMENT ON TABLE user_template_favorites IS '用戶收藏的模板';
COMMENT ON VIEW trending_templates IS '24小時內熱門模板視圖';
