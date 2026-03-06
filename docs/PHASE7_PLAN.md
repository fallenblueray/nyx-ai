# Phase 7 開發計劃：Trending & Favorites

> **決策日期**: 2026-03-06
> **負責人**: 千螢
> **模型**: Kimi K2.5 (規劃) → DeepSeek V3.2 (測試)

---

## 功能範圍

### 7.1 Trending 熱門統計
- [ ] 新增 Supabase 表 `template_usage_stats`
- [ ] 新增 API `/api/templates/trending`
- [ ] 新增 TrendingSection 組件
- [ ] TemplateCard 顯示「今天熱門」徽章

### 7.2 Favorites 收藏功能
- [ ] 新增 Supabase 表 `user_template_favorites`
- [ ] 新增 API `/api/user/favorites` (GET/POST/DELETE)
- [ ] TemplateCard 添加收藏按鈕
- [ ] TemplateSelector 新增「我的收藏」區塊
- [ ] 僅登入用戶可用（未登入隱藏收藏功能）

---

## 子任務清單

### 階段 1: 數據庫設計 (1h) ✅ 完成
- [x] 設計 `template_usage_stats` 表結構
- [x] 設計 `user_template_favorites` 表結構
- [x] 創建 SQL 遷移文件: `007_template_trending_favorites.sql`

### 階段 2: API 後端 (1.5h) ✅ 完成
- [x] 實現 trending API: `/api/templates/trending`
- [x] 實現 favorites CRUD API: `/api/user/favorites` (GET/POST/DELETE)
- [x] 更新 generate-story API 記錄模板使用

### 階段 3: UI 組件 (1.5h) ✅ 完成
- [x] 收藏按鈕組件 FavoriteButton.tsx
- [x] TrendingSection 組件
- [x] 「我的收藏」區塊 FavoritesSection.tsx
- [x] TemplateSelector 整合（新增 Trending 分類頁、集成兩個 Section）

### 階段 4: 測試與部署 (1h) 🔄 進行中
- [ ] Lint + TypeScript 檢查
- [ ] 測試收藏功能
- [ ] 測試 Trending 顯示
- [ ] 部署到 Vercel

---

## 技術規格

### 數據表結構

```sql
-- template_usage_stats
- id: uuid
- template_id: text (模板 slug)
- user_id: uuid? (可為匿名)
- anonymous_id: text?
- used_at: timestamp
- word_count: integer

-- user_template_favorites
- id: uuid
- user_id: uuid
- template_id: text
- created_at: timestamp
- UNIQUE(user_id, template_id)
```

### API 端點

```
GET  /api/templates/trending?limit=10&hours=24
GET  /api/user/favorites
POST /api/user/favorites { templateId }
DELETE /api/user/favorites/:templateId
```

### 組件結構

```
TemplateSelector.tsx
├── TrendingSection.tsx      (新增)
├── FavoritesSection.tsx     (新增)
└── TemplateCard.tsx
    └── FavoriteButton.tsx   (新增)
```

---

## 當前進度

- [ ] 階段 1 開始
- [ ] 階段 2 開始
- [ ] 階段 3 開始
- [ ] 階段 4 開始

---

## 重要決策記錄

### 2026-03-06: 刪除干擾 system prompt 的用戶設定

**問題**：
- V4.1 (9600字超限) 和 V4.3 (6344字超限) 歷史問題
- 用戶設定（字數長度、故事風格）覆蓋了 system prompt 控制
- 導致故事脫離 system prompt 預期

**解決方案**：
1. **刪除「預設字數長度」設定**
   - 移除設定頁面的 Word Count 標籤頁
   - 移除 `WordCountDisplay` 組件
   - 刪除 MemorySettings 中的字數偏好卡片

2. **刪除「故事風格」主題選擇**
   - 從 `useAppStore` 移除 `storyTheme` 狀態
   - 移除 `ThemeSelector` 組件
   - 刪除相關導入和處理函數

**效果**：
- ✅ system prompt 重新獲得完全控制權
- ✅ 消除用戶覆蓋導致的字數超限問題
- ✅ 故事生成更符合 system prompt 預期

**剩餘工作**：
- 完全修復所有 lint 錯誤（29個 → 剩餘約 20個）
- 部署測試 Phase 7 功能

---

*開始時間: 等待確認後開始*
