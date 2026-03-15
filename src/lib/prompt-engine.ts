/**
 * V7.0: 極簡版 Prompt Engine - 簡化大綱系統
 * 大綱只生成「起始場景描述」，讓 AI 自由發展故事
 */

// 動態提示詞緩存
let promptCache: Record<string, string> = {}
let cacheTimestamp = 0
const CACHE_DURATION = 10000

/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
export function clearPromptCache(): void {
  promptCache = {}
  cacheTimestamp = 0
}

export async function getPromptFromDB(key: string): Promise<string | null> {
  const now = Date.now()
  if (now - cacheTimestamp < CACHE_DURATION && promptCache[key]) {
    return promptCache[key]
  }

  try {
    if (typeof window === 'undefined') {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      
      const { data, error } = await supabase
        .from('admin_prompts')
        .select('content')
        .eq('key', key)
        .eq('is_active', true)
        .single()

      if (error || !data) return null
      promptCache[key] = data.content
      cacheTimestamp = now
      return data.content
    }
    return null
  } catch (error) {
    return null
  }
}

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
  tension: string
}

// V8.0: 從數據庫讀取角色提示詞，支持動態更新和原型配置
export async function buildCharacterPrompt(
  templateWorld: string,
  archetypes?: { female: string; male: string }
): Promise<string> {
  const customPrompt = await getPromptFromDB('character')
  
  // V8.0: 如果有原型配置，使用原型指導生成
  if (archetypes?.female && archetypes?.male) {
    return `根據以下世界設定和角色原型，創建兩個角色。

【世界設定】
${templateWorld}

【角色原型指導】
女主角原型方向：${archetypes.female}
男主角原型方向：${archetypes.male}

【核心要求】
1. **嚴格按照原型指導創作角色** - 必須體現原型中的年齡、職業、性格特點
2. **每次必須產生全新的角色組合** - 禁止重複使用之前的名字
3. 角色之間要有張力和戲劇衝突
4. 描述簡潔有力，避免過多形容和比喻
5. 直接描述，不要用詩意語言

【輸出格式 - 嚴格遵守】
必須使用以下格式，包含「角色1：」和「角色2：」標記：

角色1：[女主角名字]，[年齡]歲，[身份/職業]。她[性格特點]，[外貌描述]，[欲望風格]。

角色2：[男主角名字]，[年齡]歲，[身份/職業]。他[性格特點]，[外貌描述]，[欲望風格]。`
  }
  
  if (customPrompt) {
    return customPrompt.replace(/\{\{templateWorld\}\}/g, templateWorld)
  }
  
  // 默認提示詞 - V8.0 版本（無原型時的 fallback）
  return `根據以下世界設定，創建兩個角色。

【世界設定】
${templateWorld}

【核心要求】
1. **每次必須產生全新的角色組合** - 禁止重複使用之前的名字
2. 根據世界設定，AI 自行判斷最合理的年齡和身份關係：
   - 如果是學妹誘惑：女角應為 18-20歲大一新生，活潑可愛
   - 如果是女上司：女角應為 25-35歲成熟職場女性
   - 如果是鄰居人妻：女角應為 28-35歲溫婉少婦
   - 年齡差由情境決定（可女大男小，也可男大女小）
3. 角色之間要有張力和戲劇衝突
4. 描述簡潔有力，避免過多形容和比喻

【輸出格式 - 嚴格遵守】
必須使用以下格式，包含「角色1：」和「角色2：」標記：

角色1：[女主角名字]，[年齡]歲，[身份]。她[性格特點]，[外貌描述]，[欲望風格]。

角色2：[男主角名字]，[年齡]歲，[身份]。他[性格特點]，[外貌描述]，[欲望風格]。`
}

// V7.0: 簡化大綱提示詞 - 只生成起始場景
export async function buildOutlinePrompt(
  templateWorld: string,
  char1Desc: string,
  char2Desc: string
): Promise<string> {
  const customPrompt = await getPromptFromDB('outline')
  
  if (customPrompt) {
    return customPrompt
      .replace(/\{\{templateWorld\}\}/g, templateWorld)
      .replace(/\{\{characterPair\}\}/g, `${char1Desc}\n${char2Desc}`)
  }
  
  // V7.0: 極簡大綱 - 只描述起始場景
  return `根據以下設定，描述故事的第一幕場景（約200字）：

【世界設定】
${templateWorld}

【角色】
${char1Desc}
${char2Desc}

【要求】
1. 描述角色第一次相遇或衝突發生的場景
2. 設定時間、地點、氛圍
3. 點出故事的初始張力或懸念
4. **不要寫後續發展** - 只寫「開始」的部分
5. 讓讀者期待故事的展開

【輸出】
直接輸出場景描述，無需分段、無需標題。`
}

// V6.1: 改進解析 - 優先使用「角色1：」「角色2：」標記
export function parseCharacterResponse(response: string): { char1: string; char2: string } | null {
  const text = response.trim()
  
  // 方法1：找「角色1：」和「角色2：」標記（最可靠）
  const role1Match = text.match(/角色1[：:]([\s\S]*?)(?=角色2[：:]|$)/)
  const role2Match = text.match(/角色2[：:]([\s\S]*)/)
  
  if (role1Match && role2Match) {
    return {
      char1: role1Match[1].trim(),
      char2: role2Match[1].trim()
    }
  }
  
  // 方法2：找「角色2」或第二個人名
  const lines = text.split('\n').filter(l => l.trim())
  
  // 嘗試用「角色2」「男」「她/他」分割
  let splitIndex = text.search(/(?:角色2|男主角|他[是叫，,])/)
  if (splitIndex < 10) {
    // 找第二個人名（第一個標點後的大寫/名稱）
    const nameMatches = text.match(/[，。,\s]([\u4e00-\u9fa5]{2,4})(?:[，,])/g)
    if (nameMatches && nameMatches.length > 1) {
      const secondNameMatch = text.match(/([\u4e00-\u9fa5]{2,4})[^，。,]*(?:[，,][^，。,]*?)([\u4e00-\u9fa5]{2,4})/)
      if (secondNameMatch) {
        splitIndex = text.indexOf(secondNameMatch[2])
      }
    }
  }
  
  if (splitIndex < 10) {
    // 粗略二分
    splitIndex = Math.floor(text.length / 2)
  }
  
  const char1 = text.slice(0, splitIndex).trim()
  const char2 = text.slice(splitIndex).trim()
  
  if (!char1 || !char2) return null
  
  return { char1, char2 }
}

// V7.0: 大綱直接返回文本（不再分段）
export function parseOutlineResponse(response: string): string {
  return response.trim() || "故事即將開始..."
}

// V6.0: 從描述提取結構化信息（簡化版）
export function extractCharacterFromText(text: string): CharacterConfig {
  // 提取名字
  const nameMatch = text.match(/^[^，,是：]+(?:[，,是：])/)
  const name = nameMatch ? nameMatch[0].replace(/[，,是：]/, '').trim() : '未知'
  
  // 提取年齡
  const ageMatch = text.match(/(\d{1,2})\s*[歲岁]/)
  const age = ageMatch ? ageMatch[1] + '歲' : ''
  
  // 提取身份
  const roleMatch = text.match(/(?:是|身份)[^。，,]+/)
  const role = roleMatch ? roleMatch[0].replace(/[是身份]/, '').trim().slice(0, 20) : ''
  
  return {
    name,
    age,
    role,
    personality: text.slice(0, 50) + '...',
    appearance: text,
    desireStyle: '',
    traits: []
  }
}

export async function generateCharacterPair(
  templateWorld: string,
  callAI: (prompt: string) => Promise<string>,
  archetypes?: { female: string; male: string }
): Promise<{ char1: string; char2: string } | null> {
  const prompt = await buildCharacterPrompt(templateWorld, archetypes)
  const response = await callAI(prompt)
  return parseCharacterResponse(response)
}

export async function generateOutline(
  templateWorld: string,
  char1: string,
  char2: string,
  callAI: (prompt: string) => Promise<string>
): Promise<string> {
  const prompt = await buildOutlinePrompt(templateWorld, char1, char2)
  const response = await callAI(prompt)
  return parseOutlineResponse(response)
}

// V7.0: 模板上下文接口
export interface TemplateContext {
  baseScenario: string
  writingStyle: string
  atmosphere: string
}

// V7.0: 極簡版故事生成提示詞 - 單一大綱
// V8.0: 新增 intensity 參數支持
export async function buildStoryPrompt(
  systemPrompt: string,
  character1: CharacterConfig,
  character2: CharacterConfig,
  openingScene: string,  // V7.0: 改為單一開端場景
  userInput?: string,
  templateContext?: TemplateContext,
  intensityModifier?: string  // V8.0: 刺激度修飾符
): Promise<string> {
  const customPrompt = await getPromptFromDB('story')

  // 構建模板元素提示
  const templateElements = templateContext ? `
【故事情境】${templateContext.baseScenario}
【寫作風格】${templateContext.writingStyle}
【氛圍基調】${templateContext.atmosphere}
` : ''

  // V8.0: 刺激度修飾
  const intensitySection = intensityModifier ? `
【內容強度要求 - 重要】
${intensityModifier}
必須嚴格按照上述強度要求創作，不可偏離。
` : ''

  if (customPrompt) {
    // V7.0: 使用新變數名
    // V8.0: 在適當位置插入刺激度修飾符
    let prompt = customPrompt
      .replace(/\{\{templateWorld\}\}/g, systemPrompt)
      .replace(/\{\{openingScene\}\}/g, openingScene)
      .replace(/\{\{userInput\}\}/g, userInput || '')
      + templateElements

    // V8.0: 如果有刺激度修飾符，插入到創作要求之前
    if (intensitySection) {
      prompt = prompt.replace(/【創作要求】/, `${intensitySection}\n【創作要求】`)
    }

    return prompt
  }

  // V7.0: 預設提示詞 - 簡化版本
  // V8.0: 加入刺激度修飾符
  return `${systemPrompt}
${templateElements}

【角色設定】
${character1.name}，${character1.age}，${character1.role}。${character1.personality || ''}
${character2.name}，${character2.age}，${character2.role}。${character2.personality || ''}

【起始場景】
${openingScene}
${intensitySection}
${userInput ? `【用戶輸入】\n${userInput}\n` : ''}
【創作要求】
1. 根據起始場景自然發展故事，無需嚴格遵循特定結構
2. 讓角色互動自然、情感遞進合理
3. 根據劇情需要自然完結（1800-2500字）
4. 文筆流暢，保持風格一致性
${intensityModifier ? '5. **嚴格遵守上述內容強度要求** - 這是核心創作指導' : ''}

直接輸出故事正文。`
}

// ========== V9.0: 單一 AI 調用生成角色+大綱（性能優化）==========

export interface CombinedGenerationResult {
  characters: {
    character1: string
    character2: string
  }
  outline: string
}

/**
 * V9.0: 同時生成角色和大綱的組合提示詞
 * 目標：減少一次 AI 調用，從 ~16-30秒 優化到 ~8-12秒
 */
export async function buildCombinedPrompt(
  templateWorld: string,
  archetypes?: { female: string; male: string }
): Promise<string> {
  const archetypeSection = archetypes?.female && archetypes?.male
    ? `
【角色原型指導】
女主角原型方向：${archetypes.female}
男主角原型方向：${archetypes.male}
`
    : ''

  return `根據以下世界設定，同時創建兩個角色和開場場景。

【世界設定】
${templateWorld}${archetypeSection}

【核心要求】
1. **先創建角色1和角色2** - 包含名字、年齡、身份、性格、外貌
2. **再寫開場場景**（約200字）- 必須是這兩個角色第一次相遇/衝突的場景
3. **場景必須與角色性格匹配** - 體現角色的具體特點和關係張力
4. 只寫開場，不要寫後續發展

【輸出格式 - 嚴格遵守】
必須使用以下格式，包含三個標記：

===角色1===
[女主角名字]，[年齡]歲，[身份/職業]。她[性格特點]，[外貌描述]。

===角色2===
[男主角名字]，[年齡]歲，[身份/職業]。他[性格特點]，[外貌描述]。

===場景===
[開場場景描述，約200字，與上述角色性格匹配]

【重要】
- 必須包含 ===角色1===、===角色2===、===場景=== 三個標記
- 角色2不要使用詩意語言，直接描述即可
- 每次生成全新的角色組合，不要重複之前的名字`
}

/**
 * V9.0: 解析組合生成的回應
 */
export function parseCombinedResponse(response: string): CombinedGenerationResult | null {
  const text = response.trim()
  
  // 找標記位置
  const char1Marker = '===角色1==='
  const char2Marker = '===角色2==='
  const sceneMarker = '===場景==='
  
  const char1Start = text.indexOf(char1Marker)
  const char2Start = text.indexOf(char2Marker)
  const sceneStart = text.indexOf(sceneMarker)
  
  // 驗證標記完整性
  if (char1Start === -1 || char2Start === -1 || sceneStart === -1) {
    console.warn('[V9.0] Missing markers in combined response:', {
      hasChar1: char1Start !== -1,
      hasChar2: char2Start !== -1,
      hasScene: sceneStart !== -1
    })
    return null
  }
  
  // 提取內容
  const char1Text = text.slice(char1Start + char1Marker.length, char2Start).trim()
  const char2Text = text.slice(char2Start + char2Marker.length, sceneStart).trim()
  const sceneText = text.slice(sceneStart + sceneMarker.length).trim()
  
  // 驗證內容非空
  if (!char1Text || !char2Text || !sceneText) {
    console.warn('[V9.0] Empty content in parsed result')
    return null
  }
  
  return {
    characters: {
      character1: char1Text,
      character2: char2Text
    },
    outline: sceneText
  }
}

/**
 * V9.0: 單一調用生成角色+大綱
 * @param templateWorld 模板世界設定
 * @param callAI AI 調用函數
 * @param archetypes 可選的角色原型配置
 * @returns 角色和大綱結果，失敗返回 null
 */
export async function generateCharactersAndOutline(
  templateWorld: string,
  callAI: (prompt: string) => Promise<string>,
  archetypes?: { female: string; male: string }
): Promise<CombinedGenerationResult | null> {
  console.log('[V9.0] Starting combined generation...')
  
  const prompt = await buildCombinedPrompt(templateWorld, archetypes)
  const response = await callAI(prompt)
  
  console.log('[V9.0] AI response received, parsing...')
  
  const result = parseCombinedResponse(response)
  
  if (result) {
    console.log('[V9.0] Successfully parsed combined result:', {
      char1: result.characters.character1.slice(0, 30),
      char2: result.characters.character2.slice(0, 30),
      outlineLength: result.outline.length
    })
  } else {
    console.warn('[V9.0] Failed to parse combined response')
  }
  
  return result
}
