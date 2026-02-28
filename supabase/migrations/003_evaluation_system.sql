CREATE TABLE IF NOT EXISTS story_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL UNIQUE,
  coherence NUMERIC(4,2) NOT NULL DEFAULT 0,
  character_consistency NUMERIC(4,2) NOT NULL DEFAULT 0,
  literary_quality NUMERIC(4,2) NOT NULL DEFAULT 0,
  engagement NUMERIC(4,2) NOT NULL DEFAULT 0,
  theme_alignment NUMERIC(4,2) NOT NULL DEFAULT 0,
  creativity NUMERIC(4,2) NOT NULL DEFAULT 0,
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  summary TEXT,
  suggestions JSONB DEFAULT '[]',
  passed_threshold BOOLEAN NOT NULL DEFAULT false,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS evaluation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  prompt_hash TEXT,
  model TEXT NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  latency_ms INTEGER DEFAULT 0,
  guardrail_triggered BOOLEAN DEFAULT false,
  guardrail_type TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_se_story_id ON story_evaluations(story_id);
CREATE INDEX IF NOT EXISTS idx_se_score ON story_evaluations(overall_score);
CREATE INDEX IF NOT EXISTS idx_el_created ON evaluation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_el_model ON evaluation_logs(model);
