-- 為 stories 表添加 roles 和 topics 欄位
-- 用於存儲角色設定和故事主題（JSON 格式）

-- 添加 roles 欄位
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT NULL;

-- 添加 topics 欄位
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS topics JSONB DEFAULT NULL;

-- 添加註釋
COMMENT ON COLUMN stories.roles IS '角色設定（JSON 格式存儲）';
COMMENT ON COLUMN stories.topics IS '故事主題標籤（JSON 格式存儲）';
