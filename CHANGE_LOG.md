# NyxAI 變更日誌

> **使用方式**：每次修改代碼後，在此記錄變更，並檢查是否需要同步更新 SYSTEM.md 或 DECISIONS.md。
> 這是千螢自我同步記憶的機制。

---

## 快速檢查清單

修改代碼後，問自己：
- [ ] 這個變更影響了系統架構嗎？→ 更新 **SYSTEM.md**
- [ ] 這是一個重要設計決策嗎？→ 更新 **DECISIONS.md**
- [ ] 有已知問題被修復嗎？→ 更新 SYSTEM.md 的「已知問題」部分
- [ ] 新建了API端點或修改了現有端點嗎？→ 更新 SYSTEM.md 的「文件地圖」

---

## 變更記錄

### [2026-03-05] V4 單段生成架構重構（重大變更）

**變更類型**: 架構重構
**相關文件**: `generate-story/route.ts`, `StoryOutput.tsx`, `useAppStore.ts`

**問題背景**: 
- 多段生成架構複雜，維護成本高
- 緩存導致「選擇相同模板生成相同文章」問題

**變更內容**:
1. **單段生成**: 移除多段生成模式，簡化為單段調用 DeepSeek R1
2. **強制跳過緩存**: 所有請求 `skipCache: true`，避免緩存命中
3. **調整參數**: `max_tokens` 2800, 硬截斷上限 2500 字，目標 2000 字
4. **隱藏段數選擇**: 前端不再顯示 1/2/3 段選擇器
5. **保留備用代碼**: `outline/route.ts`, `segment/route.ts`, `handleMultiSegmentGeneration` 保留但未調用

**同步更新**:
- ✅ SYSTEM.md: 完全重寫為 V4 單段生成架構
- ✅ DECISIONS.md: 新增「為什麼簡化為單段生成」「為什麼強制跳過緩存」「為什麼降低 max_tokens」

---

### [2026-03-03] 修復字數負數仍可生成的安全漏洞

**變更類型**: 安全修復  
**相關文件**: `generate-story/route.ts`, `segment/route.ts`, `StoryOutput.tsx`

**問題描述**: 用戶關閉「字數用完」提示後，仍可繼續生成故事

**修復內容**:
1. generate-story/route.ts: 在進入生成流程前檢查 `currentWordCount <= 0`
2. segment/route.ts: 添加字數檢查，從 header 讀取匿名 ID
3. StoryOutput.tsx: generateSegment 函數傳遞 `x-anonymous-id` header

**同步更新**:
- ✅ SYSTEM.md: 已更新「已知問題」部分，移除此漏洞
- ✅ DECISIONS.md: 已記錄「為什麼在前端和後端都檢查字數」

---

### [2026-03-03] 支持1/2/3段動態字數與大綱生成

**變更類型**: 功能改進  
**相關文件**: `system_prompt.ts`, `outline/route.ts`, `StoryOutput.tsx`

**變更內容**:
1. 刪除 system_prompt 中的字數硬性限制（4200-4800字）
2. outline/route.ts 支持 target_segments 參數，動態生成 1/2/3 個場景
3. StoryOutput.tsx buildPrompt 動態計算字數要求（1段=2500，2段=5000，3段=7500）

**同步更新**:
- ✅ SYSTEM.md: 已更新「當前生成參數」表格
- ✅ DECISIONS.md: 已記錄「為什麼刪除 system prompt 字數限制」

---

### [2026-03-03] 建立系統說明書與決策日誌

**變更類型**: 文檔建立  
**相關文件**: `SYSTEM.md`, `DECISIONS.md`

**變更內容**:
1. 建立 SYSTEM.md（系統架構、文件地圖、當前參數、Debug速查）
2. 建立 DECISIONS.md（重要設計決策與原因）
3. 更新頂層 AGENTS.md，加入「NyxAI 工作前置協議」

**同步更新**:
- ✅ AGENTS.md: 已強制要求每次 NyxAI 工作前讀取兩份文件

---

### [2026-03-04] 錯誤處理增強與組件重構

**變更類型**: 代碼質量改進  
**相關文件**: `StoryOutput.tsx`, `hooks/useStoryGeneration.ts` (新增)

**錯誤處理增強**:
1. 新增 ErrorDisplay 組件，根據錯誤類型顯示不同圖標和建議
2. 錯誤類型識別：字數不足（橙色）、連線問題（黃色）、一般錯誤（紅色）
3. 提供可關閉的錯誤提示界面

**組件重構**:
1. 提取 `useStoryGeneration` 自定義 hook，封裝生成邏輯
2. 將 SSE 處理、狀態管理、錯誤處理邏輯從組件中抽離
3. 提高代碼可維護性和可測試性

**同步更新**:
- ✅ SYSTEM.md: 已更新「文件地圖」添加 hooks 目錄
- ✅ DECISIONS.md: 已記錄「為什麼提取自定義 hooks」

---

### [2026-03-03] UI/UX 改進：進度條、導出功能、模板系統

**變更類型**: 功能改進與 Bug 修復  
**相關文件**: `StoryOutput.tsx`, `TemplateSelector.tsx` (新增), `useAppStore.ts`

**新增功能**:
1. 生成進度條：支持 1/2/3 段動態進度計算（大綱 5% + 各段均分 + 清理 5%）
2. 導出功能：複製全文、下載 TXT、下載 Markdown（帶 UTF-8 BOM）
3. 模板系統：5 個預設模板 + 用戶可儲存自定義模板

**Bug 修復**:
1. 修復進度條不顯示：正確設置 `isStreaming` 狀態
2. 修復導出亂碼：添加 UTF-8 BOM 幫助 Windows 識別編碼
3. 修復 localStorage SSR 錯誤：改用 `useEffect` 在客戶端載入

**同步更新**:
- ✅ SYSTEM.md: 已更新「文件地圖」添加 TemplateSelector
- ✅ DECISIONS.md: 已記錄「為什麼導出需要 UTF-8 BOM」

---

*使用方式：複製上方模板，在每次重要變更後記錄於此。*
