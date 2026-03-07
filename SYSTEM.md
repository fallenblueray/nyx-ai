# NyxAI 系統說明書 (V5.2 統一 AI 生成)

> **千螢維護協議**：每次開始任何 NyxAI 工作前，必須先完整讀取此文件。

---

## 🗺️ 系統架構速覽 (V5.2)

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
[prompt-engine.ts]       ← 模板 + 角色 + 大綱 → 結構化 Prompt
    ↓
[generate-story/route.ts] ← DeepSeek R1 單段生成 (~2000字)
    ↓
SSE 流式輸出 → StoryOutput.tsx
```

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
│   ├── prompt-engine.ts                 # ✅ V5 Prompt Engine (核心)
│   │                                     #    - generateCharacterPair()
│   │                                     #    - generateOutline()
│   │                                     #    - buildStoryPrompt()
│   ├── content-cleaner.ts               # 清理 AI 思考標籤 (<thinking>)
│   ├── story-utils.ts                   # 工具函數
│   ├── themes.ts                        # 主題風格配置
│   └── humanizer.ts                     # V2.9 文字潤色 (可選)
├── app/api/
│   ├── generate-story/route.ts          # ✅ 主生成入口
│   ├── story/outline/route.ts           # ✅ V5 角色/大綱生成 (所有模板使用)
│   └── story/segment/route.ts           # ⚠️ 僅備用
├── app/app/page.tsx                     # ✅ 主界面 (含 V5.2 載入提示)
├── app/page.tsx                         # Landing Page
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

## ⚙️ 當前生成參數 (V5.1)

| 參數 | 值 | 說明 |
|------|----|------|
| 生成模型 | `deepseek/deepseek-r1-0528` | 實際寫故事 |
| max_tokens | 4500 | V5 固定值 |
| 硬截斷上限 | 2500 字 | 超過則找句子結束點截斷 |
| 目標字數 | ~2000 字 | prompt 中說明約 2000 字 |
| 緩存策略 | 強制跳過 | 所有請求 `skipCache: true` |
| 段數 | 單段 | 不再分段，自然完結 |
| **最小生成門檻** | **1000 字** | 少於此門檻直接拒絕 |

---

## 🔧 核心 API 流程

### 主入口: `/api/generate-story`

```typescript
// V5.1 雙模式支持
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
7. **V5 Prompt Engine**: 根據 template 構建結構化 prompt
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
| 2026-03-07 | V5.2 | 統一 AI 生成流程，移除模板預設角色，添加載入提示 |
| 2026-03-07 | V5.1 | 系統文檔重構，明確 V5 Prompt Engine 架構 |
| 2026-03-06 | V5 | 模板系統全面上線，移除題材芯片 |
| 2026-03-05 | V4.1 | 單段生成固化，強制 skipCache |
| 2026-03-03 | V3 | 多段生成優化（已棄用）|

---

*最後更新：2026-03-07 by 千螢*
*版本：V5.2 - 統一 AI 生成*
