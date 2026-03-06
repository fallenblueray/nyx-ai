/**
 * NyxAI 高級 Prompt Engine - 爆款級敘事架構
 * 核心理念: 角色驅動 + 劇情節奏 + 情緒遞進
 */

// Character Engine - 角色驅動系統
export interface CharacterConfig {
  name: string
  age: string
  role: string
  personality: string
  appearance: string
  desireStyle: string
  traits: string[]
}

export interface CharacterPair {
  character1: CharacterConfig
  character2: CharacterConfig
  relationship: string
  tension: string // 角色張力描述
}

export interface EmotionPhase {
  phase: number
  name: string
  description: string
  goal: string
}

// 情緒節奏定義
export const EMOTION_PHASES: EmotionPhase[] = [
  { phase: 1, name: "初始互動", description: "建立場景與角色初遇", goal: "建立基礎關係" },
  { phase: 2, name: "微妙曖昧", description: "互動中產生微妙張力", goal: "製造期待感" },
  { phase: 3, name: "情緒升溫", description: "關係逐步升級", goal: "增加緊張感" },
  { phase: 4, name: "情緒爆發", description: "情感與關係突破", goal: "滿足用戶期待" }
]

// 角色張力模板
export const CHARACTER_TENSION_TEMPLATES = [
  { type: "強弱反差", examples: ["強勢上司 vs 害羞新人", "冷艷教師 vs 叛逆學生", "成熟學姐 vs 青澀學弟"] },
  { type: "身份禁忌", examples: ["繼母與繼子", "家庭教師與學生", "上司與秘書"] },
  { type: "性格反差", examples: ["外冷內熱 vs 熱情主動", "純真無邪 vs 腹黑誘惑", "傲嬌 vs 溫柔"] },
  { type: "地位差異", examples: ["千金小姐 vs 窮書生", "女王 vs 僕人", "明星 vs 經紀人"] }
]

/**
 * 生成角色配對 Prompt
 */
export function buildCharacterPrompt(templateWorld: string): string {
  const tensionTemplate = CHARACTER_TENSION_TEMPLATES[Math.floor(Math.random() * CHARACTER_TENSION_TEMPLATES.length)]
  
  return `你是一位專業的角色設計師。請根據以下世界設定，創建一組具有強烈戲劇張力的角色配對。

世界設定：
${templateWorld}

角色張力類型：${tensionTemplate.type}
參考例子：${tensionTemplate.examples.join('、')}

請生成兩個角色，要求：
1. 角色之間要有明確的對比或張力
2. 角色個性要鮮明，能產生戲劇衝突
3. 角色的年齡、身份、性格要有層次感
4. 角色要符合成人故事的吸引力法則

輸出格式（請嚴格遵循）：

===角色1===
名稱：[角色名稱]
年齡：[年齡，如22歲]
身份：[在故事中的身份]
性格：[性格描述，30字內]
外貌：[外貌描述，40字內]
欲望風格：[角色在親密互動中的風格，20字內]
特質：[關鍵特質標籤，3-5個]

===角色2===
[同上格式]

===角色關係===
關係類型：[兩人關係]
核心張力：[這對角色最具吸引力的張力點，50字內]`
}

/**
 * 生成劇情大綱 Prompt
 */
export function buildOutlinePrompt(templateWorld: string, character1: CharacterConfig, character2: CharacterConfig): string {
  return `你是一位專業的成人故事編劇。請根據以下信息，生成一個三段式劇情大綱。

世界設定：
${templateWorld}

角色設定：
角色1：${character1.name}，${character1.age}，${character1.role}。${character1.personality}
角色2：${character2.name}，${character2.age}，${character2.role}。${character2.personality}

劇情結構要求（三段式）：
1. 開端（佔30%）：建立場景，角色初遇，埋下張力伏笔
2. 發展（佔40%）：關係升溫，情緒張力遞進，互動升級
3. 高潮（佔30%）：情緒爆發，關係突破，滿足讀者期待

情緒節奏要求：
- 初始互動 → 微妙曖昧 → 情緒升溫 → 情緒爆發
- 每個階段要有明確的情緒轉折
- 避免直接進入色情內容，要有鋪墊和張力

輸出格式（請嚴格遵循）：

===開端===
[100-150字，描述場景建立、角色初遇、張力埋伏]

===發展===
[150-200字，描述關係升溫、互動升級、情緒遞進]

===高潮===
[100-150字，描述情緒爆發、關係突破、滿足點]

===用戶預覽（開端）===
[用一句話概括開端，給用戶預覽，20字內]`
}

/**
 * 構建最終故事生成 Prompt
 */
export function buildStoryPrompt(
  templateWorld: string,
  character1: CharacterConfig,
  character2: CharacterConfig,
  outlineBeginning: string,
  outlineDevelopment: string,
  outlineClimax: string,
  userInput?: string
): string {
  return `你是一位頂級的成人小說作家。請根據以下完整設定，創作一篇沉浸式故事。

========== 世界設定 ==========
${templateWorld}

${userInput ? `========== 用戶自定義劇情起點 ==========
${userInput}
` : ''}

========== 角色設定 ==========
【角色1：${character1.name}】
- ${character1.age}，${character1.role}
- 性格：${character1.personality}
- 外貌：${character1.appearance}
- 欲望風格：${character1.desireStyle}

【角色2：${character2.name}】
- ${character2.age}，${character2.role}
- 性格：${character2.personality}
- 外貌：${character2.appearance}
- 欲望風格：${character2.desireStyle}

========== 劇情節奏 ==========
【開端】${outlineBeginning}
【發展】${outlineDevelopment}
【高潮】${outlineClimax}

========== 寫作要求 ==========
【敘事視角】使用第一人稱沉浸式敘事
【心理描寫】大量添加角色心理活動，展現內心掙扎和欲望
【環境氛圍】細膩描寫場景氛圍，用環境烘托情緒
【節奏控制】遵循「初始互動→微妙曖昧→情緒升溫→情緒爆發」的節奏
【語言風格】使用文學性現代漢語，避免粗俗直白
【內容長度】2500-3000字

========== 禁止事項 ==========
- 禁止出現「思考」、「推理」、「分析」等AI標籤
- 禁止輸出任何非故事內容
- 禁止使用段落標題或場景標記
- 禁止重複內容或無意義填充

請直接開始輸出故事，純故事內容，不要任何前言或後記。`}

/**
 * 解析角色生成結果
 */
export function parseCharacterResponse(response: string): CharacterPair | null {
  try {
    const char1Match = response.match(/===角色1===([\s\S]*?)(?====角色2===)/)
    const char2Match = response.match(/===角色2===([\s\S]*?)(?====角色關係===)/)
    const relationMatch = response.match(/===角色關係===([\s\S]*)/)
    
    if (!char1Match || !char2Match) return null
    
    const parseCharacter = (text: string): CharacterConfig => {
      const name = text.match(/名稱：(.+)/)?.[1]?.trim() || ""
      const age = text.match(/年齡：(.+)/)?.[1]?.trim() || ""
      const role = text.match(/身份：(.+)/)?.[1]?.trim() || ""
      const personality = text.match(/性格：(.+)/)?.[1]?.trim() || ""
      const appearance = text.match(/外貌：(.+)/)?.[1]?.trim() || ""
      const desireStyle = text.match(/欲望風格：(.+)/)?.[1]?.trim() || ""
      const traitsText = text.match(/特質：(.+)/)?.[1]?.trim() || ""
      const traits = traitsText.split(/[、,，\s]+/).filter(t => t)
      
      return { name, age, role, personality, appearance, desireStyle, traits }
    }
    
    const character1 = parseCharacter(char1Match[1])
    const character2 = parseCharacter(char2Match[1])
    
    const relationship = relationMatch?.[1]?.match(/關係類型：(.+)/)?.[1]?.trim() || ""
    const tension = relationMatch?.[1]?.match(/核心張力：(.+)/)?.[1]?.trim() || ""
    
    return { character1, character2, relationship, tension }
  } catch (error) {
    console.error("解析角色失敗:", error)
    return null
  }
}

/**
 * 解析大綱生成結果
 */
export function parseOutlineResponse(response: string): { 
  beginning: string
  development: string
  climax: string
  preview: string
} | null {
  try {
    const beginningMatch = response.match(/===開端===([\s\S]*?)(?====發展===)/)
    const developmentMatch = response.match(/===發展===([\s\S]*?)(?====高潮===)/)
    const climaxMatch = response.match(/===高潮===([\s\S]*?)(?====用戶預覽（開端）===)/)
    const previewMatch = response.match(/===用戶預覽（開端）===([\s\S]*)/)
    
    if (!beginningMatch || !developmentMatch || !climaxMatch) return null
    
    return {
      beginning: beginningMatch[1].trim(),
      development: developmentMatch[1].trim(),
      climax: climaxMatch[1].trim(),
      preview: previewMatch?.[1]?.trim() || "精彩故事即將開始..."
    }
  } catch (error) {
    console.error("解析大綱失敗:", error)
    return null
  }
}

/**
 * 生成角色配對（API 調用包裝）
 */
export async function generateCharacterPair(
  templateWorld: string,
  callAI: (prompt: string) => Promise<string>
): Promise<CharacterPair | null> {
  const prompt = buildCharacterPrompt(templateWorld)
  const response = await callAI(prompt)
  return parseCharacterResponse(response)
}

/**
 * 生成劇情大綱（API 調用包裝）
 */
export async function generateOutline(
  templateWorld: string,
  character1: CharacterConfig,
  character2: CharacterConfig,
  callAI: (prompt: string) => Promise<string>
): Promise<{ beginning: string; development: string; climax: string; preview: string } | null> {
  const prompt = buildOutlinePrompt(templateWorld, character1, character2)
  const response = await callAI(prompt)
  return parseOutlineResponse(response)
}