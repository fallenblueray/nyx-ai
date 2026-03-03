# NyxAI 系統說明書

> **千螢維護協議**：每次開始任何 NyxAI 工作前，必須先完整讀取此文件。
> 昨天花了一天沒解決的問題，今天讀了這份文件後一次成功。

---

## 🗺️ 系統架構速覽

```
用戶輸入（一句話）
    ↓
[outline/route.ts]   ← Kimi K2.5 生成2場景大綱 (JSON)
    ↓
[segment/route.ts]   ← DeepSeek R1 生成第1段 (~2500字)
    ↓
[segment/route.ts]   ← DeepSeek R1 生成第2段 (~2500字，注入上下文)
    ↓
合併 → 前端 SSE 流式輸出（StoryOutput.tsx）
```

**替代路徑（Legacy）**：`generate-story/route.ts` 的 `handleMultiSegmentGeneration`
— 前端通過 `x-multi-segment: true` header 觸發

---

## 📁 文件地圖（只記最重要的）

```
src/
├── app/api/
│   ├── story/outline/route.ts           # 大綱生成（Kimi K2.5）
│   ├── story/segment/route.ts           # 單段生成（DeepSeek R1）
│   ├── story/segment/system_prompt.ts   # ⚠️ 核心 prompt，輕易不要動
│   └── generate-story/route.ts          # Legacy多段流式生成
├── lib/
│   ├── content-cleaner.ts               # 清理 AI 思考標記、分段標記
│   ├── story-segmentation.ts            # 上下文提取、分段邏輯
│   └── story-utils.ts                   # 工具函數
└── components/
    └── StoryOutput.tsx                  # 前端：故事生成/顯示/續寫
```

---

## ⚙️ 當前生成參數（V2.5，2026-03-03）

| 參數 | 值 | 說明 |
|------|----|------|
| 大綱模型 | `moonshotai/kimi-k2.5` | 規劃大綱用 |
| 生成模型 | `deepseek/deepseek-r1-0528` | 實際寫故事 |
| 目標字數/段 | 2500字 | prompt 中明確說明 |
| 硬截斷上限 | 2800字 | 後處理截斷 |
| max_tokens | 4500 | 確保能輸出 2500 字 |
| 場景數量 | 2 場景 | outline 強制生成2個 |

---

## 🔄 上下文注入機制（解決中後段品質問題）

**原理**：第2段生成時，不只傳「結尾500字」，而是傳結構化信息：

```
【前文輪廓】
角色狀態：角色A(狀態)、角色B(狀態)
關係發展：...
關鍵道具：...

【風格樣本】← 取中段400字（非結尾！避免高潮污染）
...

【銜接點】← 末尾400字，直接接續
...

【本段大綱】← 從 outline 取得
場景：...
核心事件：...
```

**為什麼取中段作風格樣本？**
如果取結尾，結尾通常是高潮或轉折的頂點，容易讓下一段「重複高潮」或風格失控。中段代表整體基調。

---

## 🧹 內容清理流水線

```
原始 AI 輸出
  → cleanGeneratedContent()     移除 <think> 標籤、分段標記
  → extractPureStoryContent()   移除 【】[]() 等非故事行
  → cleanSegmentTransition()    移除「繼續」「承接」等過渡詞
  → removeOverlap()             移除前後段重疊內容
  → truncateToTarget(2500)      硬截斷
```

---

## ✅ 已解決的歷史問題

| 問題 | 解決方案 | 日期 |
|------|---------|------|
| 字數超標（6800字/2段） | 統一目標2500字 + 硬截斷2800字 | 2026-03-03 |
| 中後段語法崩壞（人設混亂） | 風格樣本取中段 + 結構化上下文 | 2026-03-03 |
| AI 思考標籤出現 | content-cleaner.ts 過濾 | 2026-03-02 |
| 分段標記（第1段等） | 正則過濾 + prompt 禁止 | 2026-03-02 |
| 「劇情主線太長」錯誤 | story-utils.ts 規則摘要 | 2026-03-01 |

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

# 2. 提交
git add -A && git commit -m "..."

# 3. 推送
git push origin main

# 4. Vercel 部署
npx vercel --prod --yes --token $VERCEL_TOKEN
```

**Vercel Token**：存於記憶庫，不在此處記錄

---

## 🔍 Debug 速查

遇到故事生成問題，先檢查：

1. **字數問題** → 看 `segment/route.ts` 的 MAX_SEGMENT_LENGTH
2. **品質崩壞** → 看上下文注入邏輯（previousMid / previousEnding）
3. **API 錯誤** → 看 OpenRouter key 和模型名稱是否正確
4. **前端不顯示** → 看 StoryOutput.tsx 的 SSE 處理邏輯

---

## 📝 待處理（Known Issues）

| 問題 | 優先級 | 狀態 |
|------|--------|------|
| 總字數偏少（2102字 vs 目標5000字） | 中 | 待修復 |
| 續寫劇情缺乏變化 | 低 | 待規劃 |

---

*最後更新：2026-03-03 by 千螢*
