-- 為 stories 表添加短鏈接 ID
-- Migration: 20250312_add_short_id_to_stories

-- 1. 添加 short_id 字段
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS short_id TEXT UNIQUE;

-- 2. 為現有記錄生成 short_id
-- 使用現有 ID 的前 8 位作為初始 short_id
UPDATE stories 
SET short_id = SUBSTRING(id::text, 1, 8)
WHERE short_id IS NULL;

-- 3. 創建索引加速查詢
CREATE INDEX IF NOT EXISTS idx_stories_short_id ON stories(short_id);

-- 4. 添加模板名稱字段（用於顯示）
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS template_name TEXT;

-- 5. 添加觸發器函數：自動生成 short_id
CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.short_id IS NULL THEN
        -- 生成 8 位隨機字符串（包含大小寫字母和數字）
        NEW.short_id := SUBSTRING(
            MD5(NEW.id::text || EXTRACT(EPOCH FROM NOW())::text), 
            1, 8
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 創建觸發器
DROP TRIGGER IF EXISTS trigger_generate_short_id ON stories;
CREATE TRIGGER trigger_generate_short_id
    BEFORE INSERT ON stories
    FOR EACH ROW
    EXECUTE FUNCTION generate_short_id();

-- 7. 添加註釋
COMMENT ON COLUMN stories.short_id IS '短鏈接 ID，用於分享頁面 /s/{short_id}';
COMMENT ON COLUMN stories.template_name IS '模板名稱，用於顯示故事類型';
