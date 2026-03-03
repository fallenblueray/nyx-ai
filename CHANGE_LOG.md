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

*使用方式：複製上方模板，在每次重要變更後記錄於此。*
