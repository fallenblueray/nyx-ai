-- V1.068: Auto-sync default prompts from code to database
-- 此迁移脚本在部署时自动同步代码中的默认提示词到数据库
-- 注意：只更新数据库中不存在的提示词，或标记为 is_auto_sync = true 的提示词
-- 用户手动修改的提示词（is_auto_sync = false）不会被覆盖

-- 1. 添加 is_auto_sync 字段（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_prompts' AND column_name = 'is_auto_sync'
  ) THEN
    ALTER TABLE admin_prompts ADD COLUMN is_auto_sync BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 2. 创建提示词同步函数
CREATE OR REPLACE FUNCTION sync_default_prompts()
RETURNS VOID AS $$
DECLARE
  default_prompts TEXT[] := ARRAY[
    'character',
    'outline',
    'story'
  ];
  prompt_key TEXT;
BEGIN
  FOREACH prompt_key IN ARRAY default_prompts
  LOOP
    -- 检查提示词是否存在且为自动同步类型
    IF NOT EXISTS (
      SELECT 1 FROM admin_prompts 
      WHERE key = prompt_key AND is_active = true
    ) THEN
      -- 插入默认提示词（如果不存在）
      INSERT INTO admin_prompts (key, name, description, content, is_auto_sync)
      VALUES (
        prompt_key,
        CASE prompt_key
          WHEN 'character' THEN '角色生成提示詞'
          WHEN 'outline' THEN '大綱生成提示詞'
          WHEN 'story' THEN '故事生成提示詞'
          ELSE prompt_key
        END,
        '系统自动同步的默认提示词',
        '', -- 内容由代码中的 buildCharacterPrompt 等函数提供
        true
      )
      ON CONFLICT (key) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. 执行同步
SELECT sync_default_prompts();

-- 4. 添加 source_code_hash 字段用于检测代码变更
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'admin_prompts' AND column_name = 'source_code_hash'
  ) THEN
    ALTER TABLE admin_prompts ADD COLUMN source_code_hash TEXT;
  END IF;
END $$;

-- 5. 创建部署钩子表（用于追踪部署状态）
CREATE TABLE IF NOT EXISTS deployment_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  prompts_synced BOOLEAN DEFAULT false,
  git_commit TEXT,
  build_timestamp TIMESTAMPTZ
);

-- 6. 记录本次部署
INSERT INTO deployment_hooks (version, prompts_synced, git_commit, build_timestamp)
VALUES (
  'v1.068',
  true,
  (SELECT current_setting('app.git_commit', true)),
  NOW()
);

-- 7. 创建视图：显示需要同步的提示词
CREATE OR REPLACE VIEW prompts_sync_status AS
SELECT 
  key,
  name,
  version,
  is_auto_sync,
  source_code_hash,
  CASE 
    WHEN source_code_hash IS NULL THEN 'NEEDS_SYNC'
    WHEN is_auto_sync = true THEN 'AUTO_SYNC'
    ELSE 'MANUAL'
  END as sync_status,
  updated_at
FROM admin_prompts
WHERE is_active = true;

-- 8. 启用 RLS
ALTER TABLE deployment_hooks ENABLE ROW LEVEL SECURITY;

-- 9. 创建策略
DROP POLICY IF EXISTS "Allow service role full access" ON deployment_hooks;
CREATE POLICY "Allow service role full access" ON deployment_hooks
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE deployment_hooks IS '部署历史记录，用于追踪提示词同步状态';
COMMENT ON VIEW prompts_sync_status IS '提示词同步状态视图';
