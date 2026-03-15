-- Migration: 添加瀏覽器指紋追踪以解決無痕模式繞過問題
-- 創建時間: 2026-03-15

-- ============================
-- 1. 為 anonymous_usage 添加指紋欄位
-- ============================
ALTER TABLE public.anonymous_usage 
ADD COLUMN IF NOT EXISTS fingerprint TEXT,
ADD COLUMN IF NOT EXISTS fingerprint_components JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- 為指紋建立索引（用於快速查詢）
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_fingerprint 
  ON public.anonymous_usage (fingerprint) 
  WHERE fingerprint IS NOT NULL;

-- 複合索引：指紋 + IP（提高準確性）
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_fingerprint_ip 
  ON public.anonymous_usage (fingerprint, ip_address) 
  WHERE fingerprint IS NOT NULL AND ip_address IS NOT NULL;

-- ============================
-- 2. 創建指紋匹配函數（處理指紋相似度）
-- ============================
CREATE OR REPLACE FUNCTION find_anonymous_usage_by_fingerprint(
  p_fingerprint TEXT,
  p_ip_address TEXT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  anonymous_id TEXT,
  words_used INTEGER,
  words_limit INTEGER,
  fingerprint TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- 優先精確匹配指紋
  RETURN QUERY
  SELECT 
    au.id,
    au.anonymous_id,
    au.words_used,
    au.words_limit,
    au.fingerprint,
    au.created_at
  FROM public.anonymous_usage au
  WHERE au.fingerprint = p_fingerprint
  ORDER BY au.updated_at DESC
  LIMIT 1;
  
  -- 如果沒有找到，且提供了 IP，嘗試 IP + User Agent 匹配（降級方案）
  IF NOT FOUND AND p_ip_address IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      au.id,
      au.anonymous_id,
      au.words_used,
      au.words_limit,
      au.fingerprint,
      au.created_at
    FROM public.anonymous_usage au
    WHERE au.ip_address = p_ip_address
      AND au.created_at > NOW() - INTERVAL '24 hours'
    ORDER BY au.updated_at DESC
    LIMIT 1;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================
-- 3. 創建使用統計視圖（監控異常行為）
-- ============================
CREATE OR REPLACE VIEW public.anonymous_usage_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_users,
  COUNT(DISTINCT fingerprint) as unique_fingerprints,
  COUNT(DISTINCT ip_address) as unique_ips,
  AVG(words_used) as avg_words_used,
  SUM(words_used) as total_words_used
FROM public.anonymous_usage
GROUP BY DATE(created_at)
ORDER BY date DESC;

COMMENT ON TABLE public.anonymous_usage IS '匿名訪客追踪 - 已增強瀏覽器指紋識別';
COMMENT ON COLUMN public.anonymous_usage.fingerprint IS '瀏覽器指紋（用於跨會話識別）';
COMMENT ON COLUMN public.anonymous_usage.fingerprint_components IS '指紋組件詳情（用於除錯）';
COMMENT ON COLUMN public.anonymous_usage.ip_address IS 'IP 地址（輔助識別）';
COMMENT ON COLUMN public.anonymous_usage.user_agent IS 'User Agent（輔助識別）';
