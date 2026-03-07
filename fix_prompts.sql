-- 修復：插入完整的提示詞內容

-- 1. 確保表存在
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

-- 2. 插入角色生成提示詞
INSERT INTO admin_prompts (key, name, description, content)
VALUES (
  'character',
  '角色生成提示詞',
  '控制 AI 如何生成角色配對',
  '你是一位專業的角色設計師。請根據以下世界設定，創建一組具有強烈戲劇張力的角色配對。

世界設定：
{{templateWorld}}

角色張力類型：{{tensionType}}
參考例子：{{examples}}

請生成兩個角色，要求：
1. 角色之間要有明確的對比或張力
2. 角色個性要鮮明，能產生戲劇衝突
3. 角色的年齡、身份、性格要有層次感
4. 角色要符合成人故事的吸引力法則

輸出格式（請嚴格遵循）：

===角色1===
名稱：[角色名稱]
年齡：[年齡]
身份：[身份]
性格：[性格描述]
外貌：[外貌描述]
欲望風格：[風格]
特質：[標籤]

===角色2===
[同上格式]

===角色關係===
關係類型：[關係]
核心張力：[張力描述]'
)
ON CONFLICT (key) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- 3. 插入大綱生成提示詞
INSERT INTO admin_prompts (key, name, description, content)
VALUES (
  'outline',
  '大綱生成提示詞',
  '控制 AI 如何生成三段式劇情大綱',
  '你是一位專業的成人故事編劇。請根據以下信息，生成一個三段式劇情大綱。

世界設定：
{{templateWorld}}

角色設定：
角色1：{{character1.name}}，{{character1.age}}，{{character1.role}}。{{character1.personality}}
角色2：{{character2.name}}，{{character2.age}}，{{character2.role}}。{{character2.personality}}

劇情結構要求（三段式）：
1. 開端（佔30%）：建立場景，角色初遇，埋下張力伏笔
2. 發展（佔40%）：關係升溫，情緒張力遞進，互動升級
3. 高潮（佔30%）：情緒爆發，關係突破，滿足讀者期待

情緒節奏要求：
- 初始互動 → 微妙曖昧 → 情緒升溫 → 情緒爆發
- 每個階段要有明確的情緒轉折

輸出格式（請嚴格遵循）：

===開端===
[100-150字]

===發展===
[150-200字]

===高潮===
[100-150字]

===用戶預覽（開端）===
[一句話概括]'
)
ON CONFLICT (key) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- 4. 插入故事生成提示詞
INSERT INTO admin_prompts (key, name, description, content)
VALUES (
  'story',
  '故事生成提示詞',
  '控制 AI 如何生成最終故事',
  '你是一位頂級的成人小說作家。請根據以下完整設定，創作一篇沉浸式故事。

========== 世界設定 ==========
{{templateWorld}}

{{userInput}}

========== 角色設定 ==========
【角色1：{{character1.name}}】
- {{character1.age}}，{{character1.role}}
- 性格：{{character1.personality}}
- 外貌：{{character1.appearance}}
- 欲望風格：{{character1.desireStyle}}

【角色2：{{character2.name}}】
- {{character2.age}}，{{character2.role}}
- 性格：{{character2.personality}}
- 外貌：{{character2.appearance}}
- 欲望風格：{{character2.desireStyle}}

========== 劇情節奏 ==========
【開端】{{outlineBeginning}}
【發展】{{outlineDevelopment}}
【高潮】{{outlineClimax}}

========== 寫作要求 ==========
【敘事視角】使用第一人稱沉浸式敘事
【心理描寫】大量添加角色心理活動，展現內心掙扎和欲望
【環境氛圍】細膩描寫場景氛圍，用環境烘托情緒
【節奏控制】遵循「初始互動→微妙曖昧→情緒升溫→情緒爆發」的節奏
【語言風格】使用文學性現代漢語，避免粗俗直白
【內容長度】2500-3000字

========== 禁止事項 ==========
- 禁止出現「思考」、「推理」、「分析」等AI標籤
- 禁止輸出任何非故事內容
- 禁止使用段落標題或場景標記
- 禁止重複內容或無意義填充

請直接開始輸出故事，純故事內容，不要任何前言或後記。'
)
ON CONFLICT (key) DO UPDATE SET
  content = EXCLUDED.content,
  updated_at = NOW();

-- 5. 確認數據
SELECT key, name, length(content) as content_length FROM admin_prompts;