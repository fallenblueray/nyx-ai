// src/types/template.ts
/**
 * NyxAI 模板系統類型定義
 * Phase 1: 模板數據架構
 */

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

// 分類顯示配置
export interface CategoryConfig {
  id: TemplateCategory;
  name: string;
  emoji: string;
  description: string;
  order: number;
}

// 模板結構
export interface Template {
  id: string;
  slug: string;              // URL友好的ID
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
  wordCostMultiplier: number; // 消耗字數倍數（1x, 1.5x, 2x）
  isActive: boolean;
  createdAt: string;         // ISO date string
  updatedAt: string;         // ISO date string
  
  // 統計（可選，從API獲取）
  usageCount?: number;
  rating?: number;           // 評分 0-5
}

// Prompt 構建配置
export interface PromptConfig {
  systemPrompt?: string;      // 系統提示詞（Prompt Engine 使用，可選）
  baseScenario: string;      // 基礎情境描述
  writingStyle: string;      // 寫作風格提示
  atmosphere: string;        // 氛圍描述
  pace: 'slow' | 'medium' | 'fast';  // 節奏
  intensity: 'mild' | 'moderate' | 'intense';  // 情慾強度
  // V8.0: 新增角色原型配置
  characterArchetypes?: {
    female: string;          // 女主角原型描述
    male: string;            // 男主角原型描述
  };
}

// 角色卡配置
export interface CharacterConfig {
  name: string;
  role: string;              // 角色定位
  age: string;
  personality: string;
  appearance: string;
  relationship: string;      // 與主角關係
  desireStyle: string;       // 情慾風格
  background?: string;       // 背景故事
  // V8.0: 標記是否基於原型生成
  archetypeBased?: boolean;
  // V8.0: 原始原型描述
  archetypeDesc?: string;
}

// 分類導航配置
export const CATEGORY_CONFIG: CategoryConfig[] = [
  { id: 'classic', name: '經典', emoji: '💫', description: '初戀重逢、青梅竹馬', order: 1 },
  { id: 'campus', name: '校園', emoji: '🏫', description: '校花學姐、女老師', order: 2 },
  { id: 'mature', name: '人妻', emoji: '💋', description: '鄰居太太、寂寞少婦', order: 3 },
  { id: 'career', name: '職場', emoji: '💼', description: '女上司、女秘書', order: 4 },
  { id: 'taboo', name: '禁忌', emoji: '🔞', description: '年齡差、秘密戀情', order: 5 },
  { id: 'ntr', name: 'NTR', emoji: '⚡', description: '出軌、復仇、綠帽', order: 6 },
  { id: 'extreme', name: '高級', emoji: '👑', description: '特殊幻想、Premium', order: 7 },
];

// 模板篩選選項
export interface TemplateFilter {
  category?: TemplateCategory;
  isPremium?: boolean;
  searchQuery?: string;
  tags?: string[];
}

// 模板排序方式
export type TemplateSortBy = 'popular' | 'newest' | 'rating' | 'name';

// 用戶收藏的模板
export interface UserFavorite {
  templateId: string;
  addedAt: string;
  order: number;
}

// Trending 模板（帶統計）
export interface TrendingTemplate extends Template {
  recentUses: number;        // 24小時內使用次數
  trendDirection: 'up' | 'down' | 'stable';
}

// 快速生成結果
export interface QuickGenerateResult {
  matchedTemplate?: Template;
  detectedTags: string[];
  extractedEntities: {
    role?: string;
    scenario?: string;
    setting?: string;
  };
  generatedPrompt: string;
  confidence: number;        // 匹配信心度 0-1
}
