-- V5.3: Admin Prompt Management System

-- 1. Create admin_prompts table
CREATE TABLE IF NOT EXISTS admin_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert default prompts
INSERT INTO admin_prompts (key, name, description, content) 
VALUES (
  'character', 
  '角色生成提示詞', 
  '控制 AI 如何生成角色配對',
  E'你是一位專業的角色設計師。請根據以下世界設定，創建一組具有強烈戲劇張力的角色配對。\n\n世界設定：\n{{templateWorld}}\n\n角色張力類型：{{tensionType}}\n參考例子：{{examples}}\n\n請生成兩個角色...'
)
ON CONFLICT (key) DO NOTHING;

-- 3. Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language plpgsql;

DROP TRIGGER IF EXISTS update_admin_prompts_updated_at ON admin_prompts;
CREATE TRIGGER update_admin_prompts_updated_at
  BEFORE UPDATE ON admin_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable RLS
ALTER TABLE admin_prompts ENABLE ROW LEVEL SECURITY;

-- 5. Create policies
DROP POLICY IF EXISTS "Allow anonymous read" ON admin_prompts;
CREATE POLICY "Allow anonymous read" ON admin_prompts
  FOR SELECT USING (true);