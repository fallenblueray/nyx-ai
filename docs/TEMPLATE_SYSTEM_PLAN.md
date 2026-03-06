# NyxAI 模板系統技術規劃書

> **產品定位轉型**：從「AI寫作工具」→「AI黃文工廠」
> **核心策略**：模板即入口，降低生成門檻，提升成癮性

---

## 📋 執行概覽

| 階段 | 名稱 | 目標 | 預估工時 |
|------|------|------|---------|
| Phase 1 | 模板數據架構 | 建立模板數據結構和類型定義 | 2h |
| Phase 2 | 模板資料庫 | 實現模板儲存、分類、查詢 | 4h |
| Phase 3 | 模板選擇器 UI | 重構模板選擇界面 | 6h |
| Phase 4 | 角色卡系統升級 | 角色卡與模板整合 | 4h |
| Phase 5 | 快速生成入口 | 一句話生成 + 隱藏模板 | 3h |
| Phase 6 | Premium 模板 | 付費模板系統 | 4h |
| Phase 7 | Trending & Favorites | 熱門和收藏功能 | 4h |
| Phase 8 | SEO 獨立頁面 | 模板獨立頁面 | 3h |

---

## 🏗️ Phase 1: 模板數據架構

### 1.1 核心類型定義

```typescript
// src/types/template.ts

// 模板分類
export type TemplateCategory = 
  | 'classic'      // 經典題材
  | 'campus'       // 校園幻想
  | 'mature'       // 人妻幻想
  | 'career'       // 職業幻想
  | 'taboo'        // 禁忌幻想
  | 'ntr'          // NTR題材
  | 'extreme'      // 重口味
  | 'premium';     // 高級模板

// 模板結構
export interface Template {
  id: string;
  name: string;              // 顯示名稱
  description: string;       // 簡短描述
  category: TemplateCategory;
  tags: string[];            // 標籤（用於搜索）
  
  // 生成參數
  promptBuilder: PromptConfig;  // Prompt 構建配置
  
  // 角色卡配置
  characterConfig?: CharacterConfig;
  
  // 元數據
  isPremium: boolean;
  wordCost: number;          // 消耗字數倍數（1x, 1.5x, 2x）
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // 統計
  usageCount: number;
  rating: number;            // 評分 0-5
}

// Prompt 構建配置
interface PromptConfig {
  baseScenario: string;      // 基礎情境描述
  writingStyle: string;      // 寫作風格提示
  atmosphere: string;        // 氛圍描述
  pace: 'slow' | 'medium' | 'fast';  // 節奏
  intensity: 'mild' | 'moderate' | 'intense';  // 情慾強度
}

// 角色卡配置
interface CharacterConfig {
  name: string;
  role: string;              // 角色定位
  age: string;
  personality: string;
  appearance: string;
  relationship: string;      // 與主角關係
  desireStyle: string;       // 情慾風格
}
```

### 1.2 模板資料結構

```typescript
// src/data/templates.ts
// 初始 50 個模板（上線版本）

export const officialTemplates: Template[] = [
  // === 經典題材 (8個) ===
  {
    id: 'classic-001',
    name: '初戀重逢',
    description: '多年後與初戀意外相遇，舊情復燃',
    category: 'classic',
    tags: ['初戀', '重逢', '情感'],
    promptBuilder: {
      baseScenario: '多年後在街頭偶遇初戀，她已經變得更加成熟迷人',
      writingStyle: '細膩情感描寫，注重心理變化',
      atmosphere: '懷舊與曖昧交織',
      pace: 'slow',
      intensity: 'moderate'
    },
    isPremium: false,
    wordCost: 1,
    // ... 其他字段
  },
  
  // === 校園幻想 (10個) ===
  {
    id: 'campus-001',
    name: '校花學姐',
    description: '被校花學姐主動搭訕，展開秘密關係',
    category: 'campus',
    tags: ['校花', '學姐', '校園'],
    characterConfig: {
      name: '陳雨琪',
      role: '校花學姐',
      age: '20歲',
      personality: '外表高冷，內心火熱，喜歡掌控局面',
      appearance: '長髮飄逸，身材修長，氣質出眾',
      relationship: '學姐，主動追求主角',
      desireStyle: '主動大膽，喜歡引導'
    },
    // ...
  },
  
  // === 人妻幻想 (10個) ===
  {
    id: 'mature-001',
    name: '寂寞鄰居',
    description: '隔壁少婦丈夫長期出差，深夜敲門求助',
    category: 'mature',
    tags: ['鄰居', '人妻', '寂寞'],
    // ...
  },
  
  // === 職業幻想 (8個) ===
  {
    id: 'career-001',
    name: '冷豔女上司',
    description: '加班時與女上司單獨相處，氣氛逐漸曖昧',
    category: 'career',
    tags: ['上司', '職場', '加班'],
    // ...
  },
  
  // === 禁忌幻想 (6個) ===
  {
    id: 'taboo-001',
    name: '年齡的秘密',
    description: '與年長女性的秘密戀情',
    category: 'taboo',
    tags: ['年齡差', '秘密', '背德'],
    // ...
  },
  
  // === NTR題材 (5個) ===
  {
    id: 'ntr-001',
    name: '妻子的秘密',
    description: '發現妻子的秘密，展開復仇或沉淪',
    category: 'ntr',
    tags: ['NTR', '出軌', '復仇'],
    // ...
  },
  
  // === 重口味 (3個，Premium) ===
  {
    id: 'extreme-001',
    name: '支配遊戲',
    description: '權力交換的極致體驗',
    category: 'extreme',
    tags: ['支配', '控制', '調教'],
    isPremium: true,
    wordCost: 1.5,
    // ...
  },
];
```

---

## 🗄️ Phase 2: 模板資料庫

### 2.1 數據庫 Schema (Supabase)

```sql
-- 模板表
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,           -- URL友好的ID
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[],
  prompt_config JSONB NOT NULL,
  character_config JSONB,
  is_premium BOOLEAN DEFAULT false,
  word_cost_multiplier DECIMAL(3,2) DEFAULT 1.00,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用戶收藏表
CREATE TABLE user_template_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, template_id)
);

-- 模板使用統計表
CREATE TABLE template_usage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id TEXT,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  word_count INTEGER,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);

-- 熱門模板視圖（按24小時使用數排序）
CREATE VIEW trending_templates AS
SELECT 
  t.*,
  COUNT(tus.id) as recent_uses
FROM templates t
LEFT JOIN template_usage_stats tus ON t.id = tus.template_id
  AND tus.used_at > NOW() - INTERVAL '24 hours'
WHERE t.is_active = true
GROUP BY t.id
ORDER BY recent_uses DESC;

-- 索引
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_templates_premium ON templates(is_premium) WHERE is_premium = true;
CREATE INDEX idx_templates_active ON templates(is_active) WHERE is_active = true;
CREATE INDEX idx_template_usage_stats_template ON template_usage_stats(template_id);
CREATE INDEX idx_template_usage_stats_time ON template_usage_stats(used_at);
```

### 2.2 API 端點

```typescript
// src/app/api/templates/route.ts
// GET /api/templates?category=xxx&page=1&limit=20

// src/app/api/templates/trending/route.ts
// GET /api/templates/trending?limit=10

// src/app/api/templates/[id]/route.ts
// GET /api/templates/[id] - 獲取單個模板詳情

// src/app/api/user/favorites/route.ts
// GET /api/user/favorites - 獲取用戶收藏
// POST /api/user/favorites - 添加收藏
// DELETE /api/user/favorites/[id] - 取消收藏
```

---

## 🎨 Phase 3: 模板選擇器 UI

### 3.1 界面結構

```
┌─────────────────────────────────────────────────────────┐
│  快速生成                                                │
│  [一句話描述你的幻想...                    ] [立即生成]  │
├─────────────────────────────────────────────────────────┤
│  分類導航：🔥熱門 🏫校園 💼職場 💋人妻 ⚡NTR 👑高級      │
├─────────────────────────────────────────────────────────┤
│  模板卡片網格                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                │
│  │ 校花學姐  │ │ 冷豔上司  │ │ 寂寞鄰居  │                │
│  │ 描述...   │ │ 描述...   │ │ 描述...   │                │
│  │ [選擇]    │ │ [選擇]    │ │ [選擇]    │                │
│  └──────────┘ └──────────┘ └──────────┘                │
├─────────────────────────────────────────────────────────┤
│  Trending：今日熱門                                     │
│  1. 女上司深夜加班 (+123)                               │
│  2. 鄰居人妻敲門 (+98)                                  │
├─────────────────────────────────────────────────────────┤
│  我的收藏：快速訪問常用模板                              │
└─────────────────────────────────────────────────────────┘
```

### 3.2 組件結構

```typescript
// src/components/template-system/
// ├── TemplateSystem.tsx          # 主容器
// ├── QuickStartInput.tsx         # 快速生成輸入框
// ├── CategoryNav.tsx             # 分類導航
// ├── TemplateGrid.tsx            # 模板卡片網格
// ├── TemplateCard.tsx            # 單個模板卡片
// ├── TrendingSection.tsx         # 熱門區塊
// ├── FavoritesSection.tsx        # 收藏區塊
// └── PremiumBadge.tsx            # Premium 標識
```

---

## 👤 Phase 4: 角色卡系統升級

### 4.1 角色卡與模板整合

```typescript
// 模板選擇時自動生成角色卡
interface TemplateCharacter {
  // 來自模板配置
  baseCharacter: CharacterConfig;
  
  // 可自定義欄位
  customizableFields: {
    name: boolean;      // 是否允許改名
    age: boolean;
    appearance: boolean;
  };
}

// 選擇模板後的流程
// 1. 用戶點擊模板
// 2. 彈出角色卡預覽（可編輯）
// 3. 確認後進入 App，角色卡和 Prompt 已自動填充
```

### 4.2 角色卡預覽模態框

```typescript
// TemplateCharacterPreview.tsx
// - 顯示模板預設角色
// - 允許修改名稱、年齡等
// - 顯示「使用此角色」按鈕
```

---

## ⚡ Phase 5: 快速生成入口

### 5.1 一句話生成邏輯

```typescript
// src/lib/prompt-intent-parser.ts

// 用戶輸入："公司加班時和女上司發生曖昧關係"
// AI 解析意圖，匹配最佳模板，自動補充參數

interface IntentParseResult {
  matchedTemplate?: Template;
  detectedTags: string[];
  extractedEntities: {
    role?: string;
    scenario?: string;
    setting?: string;
  };
  generatedPrompt: string;
}

// 如果匹配度 > 0.8，使用模板
// 如果匹配度 < 0.8，使用通用生成
```

### 5.2 隱藏模板系統

```typescript
// 用戶無感知，但系統自動應用模板邏輯
// 快速生成 = 自動模板匹配 + 角色卡生成
```

---

## 👑 Phase 6: Premium 模板

### 6.1 Premium 模板標識

```typescript
// Premium 模板特徵：
// - 右下角金色皇冠標識
// - 消耗字數 1.5x - 2x
// - 生成故事更長（目標 3000-4000 字）
// - 可包含多角色互動
// - 更複雜的劇情結構
```

### 6.2 付費提示

```typescript
// 選擇 Premium 模板時：
// 1. 檢查用戶剩餘字數是否足夠
// 2. 如果不夠，顯示充值彈窗
// 3. 顯示「此模板消耗 1.5x 字數」提示
```

---

## 🔥 Phase 7: Trending & Favorites

### 7.1 Trending 計算

```typescript
// 算法：
// - 24 小時內使用次數
// - 按增長速度排序
// - 顯示「+xxx 人今天使用」

// 緩存策略：
// - Redis 緩存 5 分鐘
// - 避免頻繁查詢數據庫
```

### 7.2 Favorites 功能

```typescript
// 僅登入用戶可用
// 收藏數據儲存在 user_template_favorites 表
// 支持拖拽排序（未來版本）
```

---

## 🔍 Phase 8: SEO 獨立頁面

### 8.1 模板獨立頁面

```typescript
// /template/[slug]
// 例如：/template/cold-female-boss

// 頁面內容：
// - 模板標題和描述
// - 示例生成內容（靜態展示）
// - CTA 按鈕「使用此模板生成」
// - 相關模板推薦
// - Meta tags 優化
```

### 8.2 SEO 策略

```typescript
// 每個模板頁面：
// Title: "{模板名稱} - AI黃文生成器 | NyxAI"
// Description: 模板描述 + "輸入一句話，AI立即生成完整故事"
// Keywords: 模板標籤

// URL 結構：
// /template/{category}/{slug}
// 例如：/template/career/cold-female-boss
```

---

## 📁 文件結構

```
src/
├── types/
│   └── template.ts           # 模板類型定義
├── data/
│   └── templates.ts          # 初始模板數據
├── lib/
│   ├── template-matcher.ts   # 意圖匹配邏輯
│   └── prompt-builder.ts     # Prompt 構建器
├── components/
│   └── template-system/
│       ├── TemplateSystem.tsx
│       ├── QuickStartInput.tsx
│       ├── CategoryNav.tsx
│       ├── TemplateGrid.tsx
│       ├── TemplateCard.tsx
│       ├── TrendingSection.tsx
│       ├── FavoritesSection.tsx
│       └── TemplatePreviewModal.tsx
├── app/
│   ├── api/
│   │   └── templates/        # API 路由
│   └── template/
│       └── [slug]/           # SEO 獨立頁面
└── store/
    └── templateStore.ts      # 模板狀態管理
```

---

## 🎯 優先級與里程碑

### MVP（第一個版本）
- [ ] Phase 1: 類型定義
- [ ] Phase 2: 數據庫 + 本地模板數據
- [ ] Phase 3: 基礎 UI（分類 + 卡片）
- [ ] Phase 4: 角色卡整合
- [ ] Phase 5: 快速生成輸入框

### V1.1
- [ ] Phase 6: Premium 標識
- [ ] Phase 7: Trending（簡易版，本地數據）

### V1.2
- [ ] Phase 7: Favorites
- [ ] Phase 8: SEO 頁面

---

## 📝 系統文檔更新計劃

每次階段完成後必須更新：
1. **SYSTEM.md** - 新增模板系統架構章節
2. **DECISIONS.md** - 記錄設計決策
3. **CHANGE_LOG.md** - 記錄變更
4. **本文件** - 標記完成進度

---

*創建日期：2026-03-06*
*負責人：千螢*
*狀態：規劃完成，等待 Phase 1 開始*
