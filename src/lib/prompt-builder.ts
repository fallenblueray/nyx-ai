/**
 * NyxAI Prompt Builder
 * 將模板配置轉換為實際生成 Prompt
 * Phase 2: 模板資料庫 + Prompt Builder
 */

import type { Template, PromptConfig, CharacterConfig } from '@/types/template';

/**
 * 從模板構建完整的 System Prompt
 */
export function buildSystemPromptFromTemplate(template: Template, customScenario?: string): string {
  const config = template.promptBuilder;
  const character = template.characterConfig;
  
  const intensityText = {
    mild: '含蓄曖昧，情感細膩',
    moderate: '適度描寫，情慾漸進',
    intense: '大膽露骨，情慾豐富'
  }[config.intensity];

  const paceText = {
    slow: '節奏舒緩，細細鋪陳',
    medium: '節奏適中，張弛有度',
    fast: '節奏明快，直入主題'
  }[config.pace];

  const perspectiveText = {
    first: '第一人稱（「我」）',
    second: '第二人稱（「你」）',
    third: '第三人稱'
  }[config.perspective];

  let prompt = `你是一位專業的情色小說作家，擅長寫作沉浸式、細膩的成人故事。

## 創作要求
- **視角**：${perspectiveText}
- **節奏**：${paceText}
- **情慾描寫**：${intensityText}
- **氛圍**：${config.atmosphere}
- **風格**：${config.writingStyle}

## 情境設定
${customScenario || config.baseScenario}`;

  if (character) {
    prompt += `\n\n## 主要角色
- **姓名**：${character.name}
- **身份**：${character.role}
- **年齡**：${character.age}
- **性格**：${character.personality}
- **外貌**：${character.appearance}
- **關係**：${character.relationship}
- **情慾風格**：${character.desireStyle}`;
    
    if (character.background) {
      prompt += `\n- **背景**：${character.background}`;
    }
  }

  prompt += `\n\n## 寫作規範
- 使用流暢的繁體中文，文字細膩優美
- 深入描寫心理活動和身體感受
- 對話要自然，符合角色性格
- 場景描寫要有代入感
- 情節要有起承轉合，逐步升溫
- 絕對禁止：未成年相關描寫、非自願內容
- 故事約 2000 字，完整呈現一個情節`;

  return prompt;
}

/**
 * 從模板構建用戶 Prompt
 */
export function buildUserPromptFromTemplate(template: Template, userInput?: string): string {
  const scenario = userInput || template.promptBuilder.baseScenario;
  
  if (userInput) {
    return `請根據以下開頭，繼續寫一篇完整的情色故事：

${userInput}`;
  }
  
  return `請根據以下情境，寫一篇完整的情色故事：

情境：${scenario}

請直接開始故事，不要有任何前言或說明。`;
}

/**
 * 將自由輸入轉換為增強的 Prompt
 * 一句話生成時使用
 */
export function enhanceUserInput(userInput: string): {
  systemPrompt: string;
  userPrompt: string;
} {
  // 分析用戶輸入，判斷情境類型
  const input = userInput.trim();
  
  // 默認系統提示（針對自由輸入）
  const systemPrompt = `你是一位專業的情色小說作家，擅長寫作沉浸式、細膩的成人故事。

## 創作要求
- **視角**：第一人稱（「我」）
- **節奏**：節奏適中，張弛有度
- **情慾描寫**：適度描寫，情慾漸進，逐步升溫
- **風格**：細膩情感描寫，心理活動豐富

## 寫作規範
- 使用流暢的繁體中文，文字細膩優美
- 深入描寫心理活動和身體感受
- 對話要自然，情節要有代入感
- 情節要有起承轉合，逐步升溫
- 絕對禁止：未成年相關描寫、非自願內容
- 故事約 2000 字，完整呈現一個情節`;

  const userPrompt = `請根據以下故事開頭，繼續寫一篇完整的情色故事：

${input}

請直接繼續故事，保持第一人稱，細膩描寫情感和情慾發展。`;

  return { systemPrompt, userPrompt };
}

/**
 * 快速匹配：根據用戶輸入關鍵詞匹配最佳模板
 */
export function matchTemplateByInput(userInput: string, templates: Template[]): Template | null {
  const input = userInput.toLowerCase();
  
  // 關鍵詞對應分類
  const keywordMap: Record<string, string[]> = {
    career: ['上司', '老闆', '公司', '加班', '辦公室', '秘書', '護士', '空姐', '教練'],
    campus: ['學姐', '學妹', '老師', '同學', '宿舍', '校花', '圖書館', '教室'],
    mature: ['鄰居', '人妻', '少婦', '太太', '媽媽', '阿姨', '閨蜜'],
    classic: ['初戀', '青梅', '竹馬', '重逢', '同學會', '前女友'],
    taboo: ['禁忌', '背德', '秘密', '年齡', '不能說'],
    ntr: ['出軌', '老婆', '女友', 'NTR', '復仇'],
  };

  let bestCategory: string | null = null;
  let maxScore = 0;

  for (const [category, keywords] of Object.entries(keywordMap)) {
    const score = keywords.filter(kw => input.includes(kw)).length;
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  if (!bestCategory || maxScore === 0) return null;

  // 返回該分類中第一個非 Premium 的模板
  return templates.find(t => t.category === bestCategory && !t.isPremium) || null;
}
