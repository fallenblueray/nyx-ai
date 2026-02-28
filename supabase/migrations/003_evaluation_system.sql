-- NyxAI 評估系統 Migration
-- Stage 4.2: P2 評估系統表結構
-- 創建時間: 2026-02-28

-- ============================================================
-- 1. 故事評估結果表（詳細質量指標）
-- ============================================================
CREATE TABLE IF NOT EXISTS story_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  
  -- 六維度評分 (0-10)
  coherence DECIMAL(4,2) NOT NULL DEFAULT 0,
  character_consistency DECIMAL(4,2) NOT NULL DEFAULT 0,
  literary_quality DECIMAL(4,2) NOT NULL DEFAULT 0,
  engagement DECIMAL(4,2) NOT NULL DEFAULT 0,
  theme_alignment DECIMAL(4,2) NOT NULL DEFAULT 0,
  creativity DECIMAL(4,2) NOT NULL DEFAULT 0,
  
  -- 總分 (0-100)
  overall_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  -- 評估結果
  summary TEXT,
  suggestions JSONB DEFAULT '[]'::jsonb,
  passed_threshold BOOLEAN NOT NULL DEFAULT false,
  
  -- 元數據
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- 唯一約束：每個故事只有一條評估記錄
  UNIQUE(story_id)
);

-- ============================================================
-- 2. 行為追蹤日誌表（技術指標）
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 關聯
  story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- 請求元數據
  session_id TEXT,
  prompt_hash TEXT,          -- SHA256 of prompt（用於A/B分析，不存原文）
  model TEXT NOT NULL,
  
  -- Token 統計
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  
  -- 性能指標
  latency_ms INTEGER DEFAULT 0,
  
  -- 安全審計
  guardrail_triggered BOOLEAN DEFAULT false,
  guardrail_type TEXT,       -- 'injection' | 'illegal' | 'rate_limit'
  
  -- 用戶類型
  is_anonymous BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. 索引
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_story_evaluations_story_id 
  ON story_evaluations(story_id);

CREATE INDEX IF NOT EXISTS idx_story_evaluations_overall_score 
  ON story_evaluations(overall_score);

CREATE INDEX IF NOT EXISTS idx_evaluation_logs_created_at 
  ON evaluation_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evaluation_logs_user_id 
  ON evaluation_logs(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evaluation_logs_model 
  ON evaluation_logs(model);

-- ============================================================
-- 4. RLS 策略（管理員才能讀取）
-- ============================================================
ALTER TABLE story_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_logs ENABLE ROW LEVEL SECURITY;

-- 只有 service_role 可以讀寫（Admin Dashboard 用 admin client）
CREATE POLICY "Service role full access evaluations"
  ON story_evaluations FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access logs"
  ON evaluation_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 5. 視圖：每日質量統計
-- ============================================================
CREATE OR REPLACE VIEW daily_quality_stats AS
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS total_stories,
  AVG(se.overall_score) AS avg_quality_score,
  COUNT(CASE WHEN se.passed_threshold THEN 1 END) AS passed_count,
  COUNT(CASE WHEN NOT se.passed_threshold THEN 1 END) AS failed_count,
  AVG(el.latency_ms) AS avg_latency_ms,
  SUM(el.total_tokens) AS total_tokens_used,
  COUNT(CASE WHEN el.guardrail_triggered THEN 1 END) AS guardrail_triggers
FROM evaluation_logs el
LEFT JOIN story_evaluations se ON el.story_id = se.story_id
GROUP BY DATE(created_at)
ORDER BY date DESC;
