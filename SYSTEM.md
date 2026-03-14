# NyxAI 系統說明書 (V5.3 管理員後台 & 動態提示詞)

> **千螢維護協議**：每次開始任何 NyxAI 工作前，必須先完整讀取此文件。
> **✅ SYSTEM.md 已更新至 V8.4** - Phase 2 病毒增長系統 + 數據庫架構

---

## 🔥 本次會話關鍵更新 (V8.4)

### Phase 2 - 病毒增長系統
- **故事頁面系統**: `/story/{id}` 獨立故事頁面，支持短 ID，SEO 優化
- **隨機故事功能**: 一鍵生成病毒題材組合（人物+場景+開場白+刺激度評分）
- **排行榜系統**: 首頁「熱門故事」卡片 + `/trending` 完整排行榜頁面
- **病毒題材池**: 15 人物 × 12 場景 × 15 開場白，自動標籤生成

### 數據庫架構 (stories 表)
```sql
-- 核心字段
id UUID PRIMARY KEY
title TEXT
content TEXT NOT NULL
short_id VARCHAR(10) UNIQUE
template_name TEXT
is_public BOOLEAN DEFAULT true
view_count INTEGER DEFAULT 0
share_count INTEGER DEFAULT 0
created_at TIMESTAMPTZ

-- 必要索引
idx_stories_short_id, idx_stories_view_count, idx_stories_share_count

-- RLS 策略
Allow public read (is_public = true)
Allow owner read/update/insert
```

**執行位置**: `supabase/migrations/001_create_stories_table.sql`

---

## 🔥 本次會話關鍵更新 (V8.1-V8.3)

### V8.3 修復內容
- **Supabase 字段映射修復**: `/api/story/outline/route.ts` 從 `prompt_builder` JSON 對象改為扁平字段 (`base_scenario`, `character_archetypes`)
- **模型變更**: `deepseek-r1` → `x-ai/grok-4.1-fast` (OpenRouter via x.ai)
- **API 向後兼容**: 同時返回 `outline` 和 `openingScene` 字段

### V8.1-V8.2 更新
- **角色原型系統**: 模板支持從數據庫讀取 `character_archetypes`
- **錯誤處理加強**: 使用 `.maybeSingle()` 替代 `.single()` 避免拋錯
- **調試日誌**: 添加 `[Outline V8.x]` 前綴日誌便於追蹤

---

## 🗺️ 系統架構速覽 (V8.3)

```
用戶選擇模板 / 輸入一句話
    ↓
[TemplateSelector.tsx]   ← 50個官方模板 + 分類 + 收藏 + Trending
    ↓
調用 /api/story/outline (生成角色對 + 大綱)
    ↓
同時：
  ├─ 角色寫入 store.characters → 顯示在角色面板
  └─ 大綱寫入 store.storyInput → 顯示在劇情輸入框
    ↓
[prompt-engine.ts]       ← ✅ V5.3: 從數據庫動態讀取提示詞
    ↓
[generate-story/route.ts] ← DeepSeek R1 單段生成 (~2000字)
    ↓
SSE 流式輸出 → StoryOutput.tsx

管理員流程：
/admin/login → /admin/prompts → 編輯提示詞 → 保存到 Supabase
                                          ↓
                              即時影響所有新請求 (1分鐘緩存)
```

**V5.3 重大變更** (相對於 V5.2):
- ✅ **管理員後台**: `/admin/prompts` 頁面，可視化編輯提示詞
- ✅ **動態提示詞**: 提示詞從 `prompt-engine.ts` 硬編碼 → Supabase 數據庫
- ✅ **即時生效**: 修改提示詞後保存，立即影響所有新請求（無需重新部署）
- ✅ **版本追蹤**: 每次保存自動更新版本號
- ✅ **緩存機制**: 1分鐘客戶端緩存，平衡性能與即時性
- ✅ **向後兼容**: 數據庫無記錄時自動 fallback 到默認提示詞

**V5.2 重大變更** (相對於 V5.1):
- ✅ **統一 AI 生成**：所有模板調用 `/api/story/outline` 生成角色+大綱
- ✅ **移除預設角色**：模板不再包含 `characterConfig`，完全由 AI 動態生成
- ✅ **即時填充**：選擇模板後立即關閉選擇器，背景生成角色和劇情
- ✅ **載入提示**：生成過程顯示「正在生成角色與劇情大綱...」
- ✅ **用戶可編輯**：生成的劇情大綱顯示在輸入框，用戶可自由修改
- ✅ **統一顯示位置**：角色在側邊欄角色卡，劇情在左側輸入框

**V5 重大變更** (相對於早期版本):
- ✅ 產品轉型：「AI寫作工具」→「AI幻想生成器」
- ✅ 50個官方模板（7大分類：經典/校園/人妻/職場/禁忌/NTR/高級）
- ✅ 模板分類導航 + 搜索 + 收藏 + Trending
- ✅ **V5 Prompt Engine**: 從模板自動生成角色對 + 三幕大綱
- ✅ **V5.2**: 統一 AI 生成流程，所有模板動態生成角色和劇情
- ✅ **Phase 5**: Landing Page 快速生成增強（熱門模板快捷入口 + URL 參數支持）

**技術簡化**:
- 從多段生成簡化為**單段生成** (~2000字自然完結)
- `skipCache: true` 強制跳過緩存，確保每次生成新內容
- 移除題材芯片系統，全面使用模板系統

---

## 📁 文件地圖

```
src/
├── types/
│   └── template.ts                      # ✅ 模板系統類型定義
├── data/
│   └── templates.ts                     # ✅ 50個官方模板數據
│                                         #    ⚠️ V5.2: 已移除 characterConfig
├── lib/
│   ├── prompt-engine.ts                 # ✅ V5.3 Prompt Engine (動態配置)
│   │                                     #    - getPromptFromDB() 從數據庫讀取
│   │                                     #    - replaceTemplateVars() 模板變數替換
│   │                                     #    - generateCharacterPair()
│   │                                     #    - generateOutline()
│   │                                     #    - buildStoryPrompt()
│   ├── content-cleaner.ts               # 清理 AI 思考標籤 (<thinking>)
│   ├── story-utils.ts                   # 工具函數
│   ├── themes.ts                        # 主題風格配置
│   └── humanizer.ts                     # V2.9 文字潤色 (可選)
├── app/
│   ├── api/
│   │   ├── generate-story/route.ts      # ✅ 主生成入口
│   │   ├── story/outline/route.ts       # ✅ V5 角色/大綱生成
│   │   ├── story/segment/route.ts       # ⚠️ 僅備用
│   │   └── admin/
│   │       ├── prompts/route.ts         # ✅ V5.3 GET/POST 提示詞 CRUD
│   │       └── verify/route.ts          # ✅ V5.3 管理員密碼驗證
│   ├── admin/
│   │   ├── login/page.tsx               # ✅ V5.3 登入頁面
│   │   └── prompts/page.tsx             # ✅ V5.3 提示詞管理頁面
│   ├── app/page.tsx                     # ✅ 主界面
│   └── page.tsx                         # Landing Page
├── components/
│   ├── StoryOutput.tsx                  # ✅ 故事顯示 + 生成按鈕
│   ├── TemplateSelector.tsx             # ✅ V5.2: 統一調用 /api/story/outline
│   └── template/                        # ✅ 模板相關子組件
├── store/
│   └── useAppStore.ts                   # ✅ V5.2: 新增 isGeneratingTemplate
└── docs/
    └── PHASE7_PLAN.md                   # 完整技術規劃
```

---

## ⚙️ 當前生成參數 (V8.3)

| 參數 | 值 | 說明 |
|------|----|------|
| 生成模型 | `x-ai/grok-4.1-fast` | ✅ V8.3: 改為 Grok 4.1 Fast (OpenRouter) |
| 大綱模型 | `x-ai/grok-4.1-fast` | ✅ V8.3: 角色+大綱生成 |
| max_tokens | 800 | V8: 大綱生成上限 |
| max_tokens | 4500 | 故事生成上限 |
| 硬截斷上限 | 2500 字 | 超過則找句子結束點截斷 |
| 目標字數 | ~2000 字 | prompt 中說明約 2000 字 |
| 緩存策略 | 強制跳過 | 所有請求 `skipCache: true` |
| 段數 | 單段 | 不再分段，自然完結 |
| **最小生成門檻** | **1000 字** | 少於此門檻直接拒絕 |
| **提示詞緩存** | **60秒** | `prompt-engine.ts` 客戶端緩存 |
| **角色原型** | ✅ V8.1 | 支持數據庫 `character_archetypes` |
| **數據源優先級** | ✅ V8.1 | Supabase templates > local officialTemplates |

---

## 🔧 核心 API 流程

### 主入口: `/api/generate-story`

```typescript
// V5.3 雙模式支持
POST /api/generate-story

// 模式 1: V5 新架構 (推薦)
Body: {
  templateId: "xxx",              // 模板ID
  characters: {                   // V5 生成的角色對
    character1: CharacterConfig,
    character2: CharacterConfig
  },
  outline: {                      // 三幕結構
    beginning: string,
    development: string,
    climax: string
  },
  skipCache: true
}

// 模式 2: 舊架構兼容
Body: {
  systemPrompt: string,
  userPrompt: string,
  skipCache: true
}
```

**處理流程**:
1. 安全檢查（輸入驗證、Prompt Injection、非法內容、速率限制）
2. 字數額度檢查（匿名/登入用戶）
3. **預檢查門檻** - 少於 1000 字直接返回 403 錯誤
4. 記憶層注入（登入用戶的偏好）
5. 緩存層（被 `skipCache: true` 跳過）
6. 調用 DeepSeek R1 生成
7. **V5.3 Prompt Engine**: 從數據庫讀取提示詞模板
8. 實時字數檢查 - 流式輸出過程中累計字數，超過剩餘字數立即停止
9. 硬截斷處理（>2500字則找句子結束點）
10. 內容清理（移除 `<thinking>` 標籤等）
11. SSE 流式返回

### V5 Prompt Engine: `/api/story/outline`

```typescript
// 生成角色對 + 大綱
POST /api/story/outline
Body: {
  templateId: string,
  timestamp: number,      // 防止緩存
  randomSeed: number      // 確保每次生成不同角色
}

Response: {
  success: boolean,
  data: {
    characters: {
      character1: CharacterConfig,
      character2: CharacterConfig
    },
    characterTension: string,
    relationship: string,
    outline: {
      beginning: string,
      development: string,
      climax: string,
      preview: string          // 給用戶看的開端預覽
    }
  }
}
```

### V5.3 管理員 API: `/api/admin/prompts`

```typescript
// 讀取當前提示詞配置
GET /api/admin/prompts
Response: {
  prompts: [
    { key: "character", name: "角色生成", content: "...", version: 1 },
    { key: "outline", name: "大綱生成", content: "...", version: 1 },
    { key: "story", name: "故事生成", content: "...", version: 1 }
  ]
}

// 更新提示詞
POST /api/admin/prompts
Body: {
  key: "character",     // "character" | "outline" | "story"
  content: "新的提示詞內容..."
}
```

**支持的模板變數**:
- `{{templateWorld}}` - 模板世界設定
- `{{character1.name}}`, `{{character1.age}}`, `{{character1.role}}` 等角色屬性
- `{{character2.name}}`, `{{character2.age}}`, `{{character2.role}}` 等角色屬性
- `{{outlineBeginning}}`, `{{outlineDevelopment}}`, `{{outlineClimax}}` - 大綱段落
- `{{userInput}}` - 用戶自定義輸入

---

## 🧑‍💼 管理員後台 (V5.3 新增)

### 登入
- URL: `/admin/login`
- 密碼: 環境變數 `ADMIN_PASSWORD` (默認: `nyx-admin-2024`)

### 提示詞管理
- URL: `/admin/prompts`
- 功能: 編輯三種提示詞（角色、大綱、故事）
- 界面: Tab 切換，變數說明面板，保存/重置按鈕

### 數據庫表結構

```sql
CREATE TABLE admin_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,           -- "character", "outline", "story"
  name TEXT NOT NULL,                  -- 顯示名稱
  description TEXT,                    -- 描述說明
  content TEXT NOT NULL,               -- 提示詞內容
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔄 前端生成流程 (V5.2)

### 完整 V5.2 流程

```typescript
// TemplateSelector.tsx - V5.2 統一流程
1. 用戶選擇任意模板
2. 立即關閉選擇器，設置 isGeneratingTemplate = true
3. 調用 /api/story/outline 生成角色對 + 大綱
4. 同時：
   ├─ 角色寫入 store.characters → 顯示在角色面板
   └─ 大綱寫入 store.storyInput → 顯示在劇情輸入框
5. 設置 isGeneratingTemplate = false
6. 用戶可編輯角色和劇情大綱
7. 點擊「開始創作」調用 StoryOutput.tsx

// StoryOutput.tsx → generateStoryDirect()
8. 讀取 selectedTemplate, generatedCharacters, generatedOutline
9. 發送請求到 /api/generate-story (V5 模式)
10. SSE 流式接收故事內容
11. 顯示進度條和字數統計
```

### V5.2 關鍵變更

| 項目 | V5.1 | V5.2 |
|------|------|------|
| 模板角色 | characterConfig 預設 | AI 動態生成 |
| 生成時機 | 選模板 → 彈窗 → 確認後生成 | 選模板立即生成 |
| 顯示位置 | 彈窗預覽角色 | 直接寫入角色面板 |
| 劇情大綱 | 隱藏或部分顯示 | 完整三段式寫入輸入框 |
| 載入提示 | 無 | 「正在生成角色與劇情大綱...」|
| 用戶編輯 | 僅角色可編輯 | 角色和劇情都可編輯 |

### 核心函數

```typescript
// StoryOutput.tsx 中的 generateStoryDirect()
// 主要生成入口，整合 V5 和舊模式

const generateStoryDirect = async () => {
  // 檢查是否有 V5 預生成數據
  const { selectedTemplate, generatedCharacters, generatedOutline } = useAppStore.getState()
  
  if (selectedTemplate && generatedCharacters && generatedOutline) {
    // V5 模式
    requestBody = {
      templateId: selectedTemplate,
      characters: { character1, character2 },
      outline: generatedOutline,
      skipCache: true
    }
  } else {
    // 舊模式
    requestBody = {
      systemPrompt, userPrompt,
      skipCache: true
    }
  }
  
  // SSE 流式處理...
}
```

---

## 🧹 內容清理流水線

```
原始 AI 輸出
  → cleanGeneratedContent()     移除 <thinking> AI思考標籤
  → extractPureStoryContent()   移除 【】[]() 等非故事行
  → 硬截斷（2500字上限）
  → humanize (可選)
```

---

## 📊 狀態管理 (useAppStore)

### V5 新增狀態

```typescript
// 模板系統
selectedTemplate: string | null           // 當前選中的模板ID
setSelectedTemplate: (id: string | null) => void

// V5.1 預生成數據
generatedCharacters: CharacterConfig[] | null    // 生成的角色對
generatedOutline: {
  beginning: string,
  development: string,
  climax: string,
  preview: string
} | null
setGeneratedCharacters: (chars) => void
setGeneratedOutline: (outline) => void

// V5.2 載入狀態
isGeneratingTemplate: boolean            // 模板生成中（顯示載入提示）
setIsGeneratingTemplate: (v: boolean) => void
```

### 保留狀態 (向後兼容)

```typescript
// 核心狀態
storyInput: string
storyOutput: string
characters: Character[]           // 用戶自定義角色
isGenerating: boolean

// 流式生成狀態 (UI用)
streamingSegments: string[]
currentSceneIndex: number
totalScenes: number
isStreaming: boolean

// 配置
perspective: 'first-person' | 'third-person'
storyTheme: string
humanizeEnabled: boolean
targetSegments: number          // ⚠️ 雖保留但實際固定為單段
```

---

## ⚠️ 已棄用/備用組件

| 組件/路由 | 狀態 | 說明 |
|----------|------|------|
| `TopicSelector.tsx` | ✅ 已刪除 | 舊題材芯片系統 |
| `DefaultTopicsSelector.tsx` | ✅ 已刪除 | 舊預設題材功能 |
| `/api/story/segment/route.ts` | ⚠️ 備用 | 多段生成舊API，現單段為主 |
| `selectedTopics` (store) | ✅ 已移除 | 舊題材狀態 |

---

## 🔍 Debug 速查

遇到故事生成問題，先檢查：

1. **字數問題** → `MAX_TOKENS = 4500`, `MAX_STORY_LENGTH = 2500`
2. **緩存問題** → 確認 `skipCache: true` 在請求 body 中
3. **API 錯誤** → OpenRouter key 和模型名稱 (deepseek/deepseek-r1-0528)
4. **前端不顯示** → StoryOutput.tsx SSE 處理邏輯
5. **模板無效** → 確認 templateId 存在於 officialTemplates
6. **提示詞未更新** → 檢查 admin_prompts 表是否有記錄，或清除 1 分鐘後重試
7. **角色解析失敗** (`matches: {name: undefined}`):
   - 原因：AI 輸出包含 markdown 標記 `**名稱：**` 或繁簡體混用
   - 修復：`prompt-engine.ts` 先 `cleanText.replace(/\*\*/g, '')` 去除 markdown 標記
   - 使用 Unicode 碼點匹配繁簡體：`名(?:\u7a31|\u79f0|稱|称)`

---

## 🚀 標準部署流程

```bash
# 1. Build 驗證
npm run build

# 2. 提交（必須更新此文件）
git add -A && git commit -m "..."

# 3. 推送
git push origin main

# 4. Vercel 部署
export VERCEL_TOKEN="<從記憶取得>"
npx vercel --prod --yes --token "$VERCEL_TOKEN"
```

---

## 📜 變更記錄

| 日期 | 版本 | 變更 |
|------|------|------|
| 2026-03-07 | V5.3.1 | 修復角色解析：Unicode 碼點匹配繁簡體 + 去除 markdown 標記 |
| 2026-03-07 | V5.3 | 管理員後台 `/admin/prompts`，動態提示詞配置，從數據庫讀取 |
| 2026-03-07 | V5.2 | 統一 AI 生成流程，移除模板預設角色，添加載入提示 |
| 2026-03-07 | V5.1 | 系統文檔重構，明確 V5 Prompt Engine 架構 |
| 2026-03-06 | V5 | 模板系統全面上線，移除題材芯片 |
| 2026-03-05 | V4.1 | 單段生成固化，強制 skipCache |
| 2026-03-03 | V3 | 多段生成優化（已棄用）|

---

*最後更新：2026-03-07 by 千螢*
*版本：V5.3 - 管理員後台 & 動態提示詞*
