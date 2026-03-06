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

### [2026-03-06] V5.0: Phase 4 & 5 完成 - 角色卡預覽與 Landing Page 增強

**變更類型**: 功能實現
**相關文件**: 
- `TemplateSelector.tsx` - Phase 4 角色卡預覽
- `app/page.tsx` (Landing) - Phase 5 熱門模板快捷入口
- `app/app/page.tsx` - URL 模板參數支持

**Phase 4: 角色卡預覽整合**:
1. 添加 `previewTemplate` 和 `editedCharacter` 狀態管理
2. 創建角色卡預覽模態框，支持：
   - 顯示模板生成的自動角色卡
   - 編輯角色名稱、年齡、身份、性格、外貌
   - 「確認使用」按鈕套用自定義角色
3. 修改 `handleSelectTemplate` 邏輯：
   - 有角色配置的模板 → 顯示預覽
   - 無角色模板 → 直接套用

**Phase 5: Landing Page 快速生成增強**:
1. 從 `officialTemplates` 動態生成熱門模板列表（8個免費模板）
2. 根據模板分類自動分配顏色主題
3. 點擊熱門模板跳轉至 `/app?template={id}&prompt={desc}`
4. `app/page.tsx` 支持從 URL 讀取 `template` 參數：
   - 自動填充模板基礎場景
   - 自動創建模板角色
   - 自動設置主題標籤

**測試驗證**:
- [x] TemplateSelector 角色預覽模態框正常顯示
- [x] 角色編輯後正確保存到 store
- [x] Landing Page 熱門模板正確渲染
- [x] 點擊模板跳轉並自動應用參數

---

### [2026-03-05] V4.2: 修復模板切換時角色卡未清除

**變更類型**: Bug 修復
**相關文件**: `TemplateSelector.tsx`

**問題描述**: 轉換預設題材後，舊的角色卡仍然存在

**修復內容**:
1. 在 `handleApplyTemplate` 函數中添加 `setCharacters([])` 清除現有角色
2. 從 `useAppStore` 引入 `setCharacters` 方法
3. 確保套用新模板時舊角色不會殘留

---

### [2026-03-05] V4.1 緊急修復：三層字數控制（安全漏洞）

**變更類型**: 安全修復（緊急）
**相關文件**: `generate-story/route.ts`, `StoryOutput.tsx`

**問題描述**: 
- 用戶生成了 9600 字，剩餘字數卻顯示 760 字
- 系統沒有在字數為零時停止生成
- 字數為零時沒有彈出充值/註冊提示
- 允許用戶在零字數下續寫

**修復內容**:
1. **預檢查門檻**：添加 `MIN_WORDS_REQUIRED = 1000`，少於此門檻直接返回 403
2. **實時字數檢查**：流式輸出過程中累計字數，超過剩餘字數立即停止
3. **前端錯誤處理**：字數不足時清空已輸出的不完整內容，顯示充值/註冊提示

**同步更新**:
- ✅ SYSTEM.md: 更新「當前生成參數」和「V4.1 字數控制機制」章節
- ✅ DECISIONS.md: 新增「為什麼添加三層字數控制」

---

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


### [2026-03-06] Landing Page V2.2: 輸入框樣式強化

**變更類型**: UI/UX 改進
**相關文件**: `src/app/page.tsx`

**問題描述**: Landing Page 輸入框不夠明顯，轉化率不理想

**變更內容**:
1. 輸入框從單行 Input 改為兩行 Textarea（min-h-[80px]）
2. 邊框加粗：`border-2 border-white/30`
3. 標籤文字放大：`text-base md:text-lg font-semibold`
4. 提示文字改為具體範例：「我獲得絕對命令和刪除記憶的超能力...」

**Commit**: `ccda593`

---

### [2026-03-06] Landing Page V2.1: 交互式輸入框直達

**變更類型**: 功能改進（轉化優化）
**相關文件**: `src/app/page.tsx`, `src/app/app/page.tsx`

**策略**: 在 Landing Page 添加輸入框，用戶可直接輸入故事開頭，按下 Enter 或點擊按鈕直接跳轉 App 並自動填充

**變更內容**:
1. Landing Page: 添加 `userPrompt` state + Textarea 輸入框 +「立即生成」按鈕
2. 支持 Enter 快捷鍵觸發
3. 使用 `window.location.href` 跳轉到 `/app?prompt={userInput}`
4. App Page: 使用 `useSearchParams` 讀取 URL 參數，自動填充到 storyInput

**效果**: 用戶無需先進入 App 再輸入，降低轉化門檻

---

### [2026-03-06] Template System Phase 1-3：模板系統核心實現

**變更類型**: 功能重構（產品轉型）
**相關文件**: 
- `src/types/template.ts`（新增）
- `src/data/templates.ts`（新增）
- `src/lib/prompt-builder.ts`（新增）
- `src/components/TemplateSelector.tsx`（完全重寫）

**產品轉型**：從「AI寫作工具」→「AI幻想生成器」

**Phase 1 - 類型定義**:
- `Template`, `PromptConfig`, `CharacterConfig` 等完整類型
- 7大分類：經典/校園/人妻/職場/禁忌/NTR/高級

**Phase 2 - 模板數據**:
- 50個官方模板（靜態 ts 文件，無需 API）
- 每個模板含：Prompt配置、角色卡、標籤、Premium設定

**Phase 3 - 模板 UI 重構**:
- 分類導航（7個分類 Tab）
- 搜索功能
- 收藏功能（localStorage）
- Trending 熱門題材（6個）
- 我的模板（儲存/套用/刪除）
- Premium 模板標識（金色皇冠）

**Prompt Builder**:
- `buildSystemPromptFromTemplate()` - 從模板生成 System Prompt
- `buildUserPromptFromTemplate()` - 從模板生成 User Prompt
- `enhanceUserInput()` - 自由輸入增強
- `matchTemplateByInput()` - 關鍵詞匹配模板

**同步更新**:
- ✅ SYSTEM.md: 更新為 V5，新增文件地圖
- ✅ DECISIONS.md: 新增3條設計決策
- ✅ TEMPLATE_SYSTEM_PLAN.md: 規劃文件（完整8階段）

**Commit**: `b1dff53`

---

### [2026-03-06] Landing Page V2: 高轉化落地頁重構

**變更類型**: 功能改進（營銷優化）
**相關文件**: `src/app/page.tsx` (完全重寫)

**策略**: 將簡單的入口頁面改為高轉化 Landing Page

**新增區塊**:
1. **Hero**: 主標題 + 副標題 + CTA 按鈕 + 社會證明徽章
2. **即時示例**: 左右分欄展示輸入 vs AI 生成內容
3. **熱門題材**: 8 個題材卡片（女上司、人妻誘惑等），點擊自動帶入參數
4. **能力展示**: 5 項體驗導向描述
5. **使用流程**: 3 步簡化流程
6. **免費體驗**: 獨立區塊強調 8000 字免費
7. **價格方案**: 5 檔價格（5萬-300萬字），標示「首次充值半價」
8. **最終 CTA**: 底部轉化點
9. **Footer**: 簡潔版權資訊

**視覺風格**: 深色背景 + 藍紫漸變 + Floating Lines 動畫

**變更影響**:
- 大幅提升 Landing → App 轉化率（預期 50%+）
- SEO 優化：包含多個長尾關鍵詞
- 首次提供明確的價格展示

**Commit**: `7425829` (V2), `eb70977` (V2.1), `ccda593` (V2.2)

---

*使用方式：複製上方模板，在每次重要變更後記錄於此。*
