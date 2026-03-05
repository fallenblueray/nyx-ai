# NyxAI 系統說明書 (V4 單段生成)

> **千螢維護協議**：每次開始任何 NyxAI 工作前，必須先完整讀取此文件。

---

## 🗺️ 系統架構速覽 (V4 單段生成)

```
用戶輸入（一句話/模板）
    ↓
[generate-story/route.ts]   ← DeepSeek R1 單段生成 (~2000字)
    ↓
SSE 流式輸出 → StoryOutput.tsx
```

**V4 重大變更**：
- ❌ 移除了多段生成模式（原本 2-3 段大綱 + 分段生成）
- ✅ 簡化為單段生成，直接調用 DeepSeek R1
- ✅ 強制 `skipCache: true`，避免緩存命中導致重複內容

---

## 📁 文件地圖（V4 現狀）

```
src/
├── app/api/
│   ├── story/outline/route.ts           # 大綱生成（Kimi K2.5）- 僅備用
│   ├── story/segment/route.ts           # 單段生成（DeepSeek R1）- 僅備用
│   ├── story/segment/system_prompt.ts   # 核心 prompt（只讀，勿改）
│   └── generate-story/route.ts          # ✅ 主生成入口（V4 單段模式）
├── app/app/page.tsx                     # 主界面（含「新建」按鈕）
├── components/
│   ├── StoryOutput.tsx                  # 故事顯示 + 生成按鈕邏輯
│   └── TemplateSelector.tsx             # 模板選擇
├── lib/
│   ├── content-cleaner.ts               # 清理 AI 思考標籤
│   └── story-utils.ts                   # 工具函數
└── store/
    └── useAppStore.ts                   # 全局狀態（含 shouldRegenerate）
```

---

## ⚙️ 當前生成參數（V4.1，2026-03-05）

| 參數 | 值 | 說明 |
|------|----|------|
| 生成模型 | `deepseek/deepseek-r1-0528` | 實際寫故事 |
| max_tokens | 2800 | 降低以減少超長生成 |
| 硬截斷上限 | 2500 字 | 超過則找句子結束點截斷 |
| 目標字數 | ~2000 字 | prompt 中說明約 2000 字 |
| 緩存策略 | 強制跳過 | 所有請求 `skipCache: true` |
| 段數 | 單段 | 不再分段，自然完結 |
| **最小生成門檻** | **1000 字** | V4.1 新增：少於此門檻直接拒絕 |

---

## 🔧 核心 API 流程

### 主入口：`/api/generate-story`

```typescript
// V4 單段生成流程
POST /api/generate-story
Body: {
  systemPrompt,    // 官方 system_prompt.ts + 主題風格
  userPrompt,      // 構建的用戶提示
  model: "deepseek/deepseek-r1-0528",
  skipCache: true, // ✅ 強制跳過緩存
  ...
}
```

**處理流程**：
1. 安全檢查（輸入驗證、Prompt Injection、非法內容、速率限制）
2. 字數額度檢查（匿名/登入用戶）
3. **V4.1: 預檢查門檻** - 少於 1000 字直接返回 403 錯誤
4. 記憶層注入（登入用戶的偏好）
5. ❌ 緩存層（被 `skipCache: true` 跳過）
6. 調用 DeepSeek R1 生成
7. **V4.1: 實時字數檢查** - 流式輸出過程中累計字數，超過剩餘字數立即停止
8. 硬截斷處理（>2500字則找句子結束點）
9. SSE 流式返回

### V4.1 字數控制機制

```typescript
// 1. 預檢查（調用 API 前）
if (currentWordCount < MIN_WORDS_REQUIRED(1000)) {
  return 403 { errorType: "insufficient_words" | "free_quota_exceeded" }
}

// 2. 實時檢查（流式輸出過程中）
const currentWordsUsed = Math.ceil(fullContent.length * 0.8)
if (currentWordsUsed > currentWordCount) {
  // 立即停止，返回錯誤
  return SSE { error, errorType, truncated: true }
}

// 3. 完成後檢查（[DONE] 時）
const wordsUsed = Math.ceil(fullContent.length * 0.8)
if (currentWordCount < wordsUsed) {
  // 理論上不應觸發，因為有實時檢查
  return SSE { error, errorType }
}
// 扣除字數並返回成功
```

---

## 🔄 前端生成流程

### StoryOutput.tsx 中的 `generateStoryDirect`

```typescript
const generateStoryDirect = async () => {
  // 1. 重置流式狀態
  resetStreaming()
  setStoryOutput("")  // 清空舊內容
  
  // 2. 構建 prompt（單段模式）
  const { systemPrompt, userPrompt } = buildPrompt(false)
  
  // 3. 發送請求（強制 skipCache）
  const response = await fetch("/api/generate-story", {
    body: JSON.stringify({
      systemPrompt,
      userPrompt,
      skipCache: true,  // ✅ 確保不讀緩存
    })
  })
  
  // 4. SSE 流式處理
  // ...
}
```

### 「再寫一次」邏輯

```typescript
// 再寫一次按鈕
onClick={() => {
  useAppStore.getState().setShouldRegenerate(true)
}}

// useEffect 監聽
useEffect(() => {
  if (shouldRegenerate && canGenerate && !isGenerating) {
    setShouldRegenerate(false)
    generateStoryV3(true)  // 調用生成
  }
}, [shouldRegenerate])
```

---

## 🧹 內容清理流水線

```
原始 AI 輸出
  → cleanGeneratedContent()     移除 <think> 標籤
  → extractPureStoryContent()   移除 【】[]() 等非故事行
  → 硬截斷（2500字上限）
```

---

## ✅ 已解決的歷史問題

| 問題 | 解決方案 | 日期 |
|------|---------|------|
| 選擇相同模板生成相同文章 | 強制 `skipCache: true` | 2026-03-05 |
| 字數超標 | 硬截斷 2500 字 + max_tokens 2800 | 2026-03-05 |
| AI 思考標籤出現 | content-cleaner.ts 過濾 | 2026-03-02 |
| 分段標記 | 正則過濾 + prompt 禁止 | 2026-03-02 |

---

## ⚠️ 鐵律（絕對不要動這些）

1. **`system_prompt.ts`** — 只有蓋亞明確要求才能修改
2. **模型切換** — 需要蓋亞批准
3. **`FREE_WORD_LIMIT`** = 8000 字（匿名用戶額度）
4. **數據不刪除** — 歸檔目錄轉移

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
export VERCEL_TOKEN="..."
npx vercel --prod --yes --token "$VERCEL_TOKEN"
```

---

## 🔍 Debug 速查

遇到故事生成問題，先檢查：

1. **字數問題** → `MAX_TOKENS = 2800`, `MAX_STORY_LENGTH = 2500`
2. **緩存問題** → 確認 `skipCache: true` 在請求 body 中
3. **API 錯誤** → OpenRouter key 和模型名稱
4. **前端不顯示** → StoryOutput.tsx SSE 處理邏輯

---

## 📝 V4 變更記錄

| 日期 | 變更 | 影響 |
|------|------|------|
| 2026-03-05 | 簡化為單段生成 | 移除多段模式，強制 skipCache |
| 2026-03-05 | 緩存強制跳過 | 解決重複生成問題 |
| 2026-03-04 | 動態 max_tokens | 根據段數調整（已廢棄）|
| 2026-03-03 | V2.5 上下文注入 | 中段風格樣本（已廢棄）|

---

*最後更新：2026-03-05 by 千螢*
*變更記錄：見 CHANGE_LOG.md*
