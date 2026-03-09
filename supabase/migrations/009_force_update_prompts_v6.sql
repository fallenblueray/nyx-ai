-- V1.069: 强制更新所有提示词为 V6 格式
-- 执行此脚本将覆盖数据库中的旧格式提示词

-- 更新角色生成提示词（V6 格式 - 无 === 标记）
UPDATE admin_prompts 
SET 
  content = E'根據以下世界設定，創建兩個角色，用自然語言描述：\n\n世界設定：{{templateWorld}}\n\n要求：\n1. 角色之間要有張力和戲劇衝突\n2. 描述要吸引人，有代入感\n3. 包含年齡、身份、性格、外貌等基本信息\n\n輸出格式（直接輸出兩段描述，無需標題或符號）：\n\n角色1：[女主角名字]，[年齡]歲，[身份]。她[性格特點]，[外貌描述]，[欲望風格]。\n\n角色2：[男主角名字]，[年齡]歲，[身份]。他[性格特點]，[外貌描述]，[欲望風格]。',
  version = version + 1,
  is_auto_sync = true,
  source_code_hash = 'v6-character-prompt',
  updated_at = NOW()
WHERE key = 'character';

-- 更新大纲生成提示词（V6 格式 - 无 === 标记）
UPDATE admin_prompts 
SET 
  content = E'根據以下世界設定和角色配對，創建一個完整的故事大綱：\n\n世界設定：{{templateWorld}}\n\n角色配對：\n{{characterPair}}\n\n要求：\n1. 大綱要包含開端、發展、高潮三個階段\n2. 每個階段簡要描述主要情節\n3. 突出角色之間的互動和衝突\n4. 保持與世界設定的一致性\n\n輸出格式（純文本描述，不使用標記符號）：\n\n開端：[簡要描述故事的開始]\n\n發展：[描述情節如何推進]\n\n高潮：[描述最緊張的場景]',
  version = version + 1,
  is_auto_sync = true,
  source_code_hash = 'v6-outline-prompt',
  updated_at = NOW()
WHERE key = 'outline';

-- 更新故事生成提示词
UPDATE admin_prompts 
SET 
  content = E'你是一位專業的網路小說作家，擅長撰寫成人浪漫小說。\n\n根據以下信息繼續創作故事：\n\n故事背景：{{context}}\n\n當前進度：{{progress}}\n\n角色狀態：{{characters}}\n\n風格參考：\n{{styleSamples}}\n\n要求：\n1. 字數：約 {{wordCount}} 字\n2. 延續上文風格和節奏\n3. 保持角色性格一致性\n4. 推動情節發展，增加戲劇張力\n5. 結尾要製造懸念，引導讀者繼續閱讀\n\n直接輸出故事內容，無需標題或說明。',
  version = version + 1,
  is_auto_sync = true,
  source_code_hash = 'v6-story-prompt',
  updated_at = NOW()
WHERE key = 'story';

-- 验证更新结果
SELECT 
  key,
  name,
  version,
  is_auto_sync,
  source_code_hash,
  LEFT(content, 100) as content_preview,
  updated_at
FROM admin_prompts
WHERE key IN ('character', 'outline', 'story')
ORDER BY key;
