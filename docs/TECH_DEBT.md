# NyxAI 技術債清理清單

> 本文件記錄需要清理的歷史遺留代碼和優化項目。

---

## 🔴 高優先級 (影響維護)

### 1. StoryOutput.tsx - 代碼複雜度過高

**問題**：
- 文件超過 900 行，包含 4 個主要生成函數
- `generateStoryV3` 標記為已棄用但仍在代碼中
- `generateOutline` 和 `generateSegment` 函數實際不再使用
- `buildPrompt` 函數中有大量條件分支

**建議**:
```typescript
// 當前混亂結構:
- generateStoryDirect()   // 主入口 (~400行)
- generateStoryV3()       // 已棄用，直接調用前者
- generateOutline()       // 僅備用
- generateSegment()       // 僅備用
- continueStory()         // 續寫功能
- buildPrompt()           // 複雜條件分支

// 建議簡化為:
- generateStory()         // 統一主入口
- continueStory()         // 續寫保留
- buildV5Prompt()         // V5新架構專用
- buildLegacyPrompt()     // 舊架構兼容
```

**工作量**: 2-3 小時重構 + 測試

---

### 2. useAppStore.ts - 無用狀態殘留

**問題**：
```typescript
// V3 多段生成殘留，現單段為主
targetSegments: number      // 固定為 1，無需狀態
storyOutline: unknown       // 不再使用隱形大綱
dynamicContext: {...}       // 多段上下文追踪，現無用
streamingSegments: string[] // 現只單段，無需數組
```

**建議**: 移除或標記為已棄用

**工作量**: 30 分鐘

---

### 3. API 路由 - 混亂的兼容層

**問題**：

```typescript
// generate-story/route.ts (約500行)
// 同時支持兩種完全不同的模式：

// 模式1: V5 Prompt Engine
if (templateId && characters && outline) {
  // 從 template 構建
}

// 模式2: 舊架構直接傳 prompt
else if (legacySystemPrompt && legacyUserPrompt) {
  // 直接使用傳入的 prompt
}
```

**建議**: 
- 長期目標：完全遷移至 V5 架構
- 或將兩種模式拆分為不同路由

**工作量**: 大規模重構，需 4-6 小時

---

## 🟡 中優先級 (代碼質量)

### 4. 備用 API 路由維護

**文件**：
- `/api/story/segment/route.ts` - 僅備用
- `/api/story/outline/route.ts` - 現被 V5 版本替代

**問題**：
- 這些路由可能與主生產代碼不同步
- 占用構建時間和包大小

**建議**:
- 方案A: 完全刪除（主流程已穩定）
- 方案B: 移至 `src/app/api/_deprecated/`

---

### 5. humanizer.ts - 可選功能維護成本

**問題**:
- humanizer 功能開啟時增加複雜度
- 緩衝區邏輯容易出錯
- 實際價值待驗證

**建議**:
- 評估是否保留或簡化
- 或改為後端處理而非前端

---

### 6. 類型定義分散

**問題**:
```typescript
// Character 定義在多處：
- store/useAppStore.ts        Character
- types/template.ts           Template['characterConfig']
- lib/prompt-engine.ts        CharacterConfig
- domain/story/entities/      StoryRole
```

**建議**: 統一類型定義

---

## 🟢 低優先級 (錦上添花)

### 7. 測試文件

**問題**:
- `src/__tests__/domain/` 中的測試可能已過時
- Story 實體測試仍引用舊的 topics 類型

**建議**: 更新或移除過時測試

---

### 8. 樣式文件

**問題**:
- `src/app/globals.css` 可能存在未使用的 CSS
- Tailwind 配置可能包含未用的顏色定義

---

## 📊 清理計劃建議

### 短期 (1-2 天)
1. 移除 useAppStore 無用狀態
2. 簡化 StoryOutput.tsx 的 buildPrompt
3. 更新或移動備用 API 路由

### 中期 (1 週)
1. 重構 StoryOutput.tsx 拆分過大組件
2. 統一類型定義
3. 清理過時測試

### 長期 (1 個月)
1. 完全遷移至 V5 Prompt Engine 架構
2. 移除舊模式兼容層
3. 重構 generate-story API 路由

---

## 🎯 立即行動

如需執行任何清理任務，請:

1. 從高優先級選項開始
2. 每次清理後運行 `npm run build` 驗證
3. 更新此文件標記已完成項目
4. 重大變更更新 CHANGE_LOG.md

---

*創建：2026-03-07 by 千螢*
