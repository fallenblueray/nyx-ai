/**
 * V6.0: 簡化版 Prompt Engine - 移除所有格式標記
 * 直接返回純文本，不再強制解析結構
 */

// 動態提示詞緩存
let promptCache: Record<string, string> = {}
let cacheTimestamp = 0
const CACHE_DURATION = 10000

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

// V6.1: 從數據庫讀取角色提示詞，支持動態更新
export async function buildCharacterPrompt(templateWorld: string): Promise<string> {
  const customPrompt = await getPromptFromDB('character')
  
  if (customPrompt) {
    return customPrompt.replace(/\{\{templateWorld\}\}/g, templateWorld)
  }
  
  // 默認提示詞
  return `根據以下世界設定，創建兩個角色，用自然語言描述。

【世界設定】
${templateWorld}

【核心要求】
1. **每次必須產生全新的角色組合** - 禁止用「林語嫣」「蘇婉」等之前出現過的名字
2. 根據世界設定，AI 自行判斷最合理的年齡和身份關係：
   - 如果是學妹誘惑：女角應為 18-20歲大一新生，活潑可愛
   - 如果是女上司：女角應為 25-35歲成熟職場女性
   - 如果是鄰居人妻：女角應為 28-35歲溫婉少婦
   - 年齡差由情境決定（可女大男小，也可男大女小）
3. 角色之間要有張力和戲劇衝突
4. 描述要吸引人，有代入感
5. **絕對禁止**使用之前生成過的名字（林語嫣、蘇婉、婉清等常見武俠名完全禁用）

【輸出格式】
直接輸出兩段描述，無需標題或符號：

角色1：[女主角名字]，[年齡]歲，[身份]。她[性格特點]，[外貌描述]，[欲望風格]。

角色2：[男主角名字]，[年齡]歲，[身份]。他[性格特點]，[外貌描述]，[欲望風格]。`
}

// V6.1: 從數據庫讀取大綱提示詞，支持動態更新
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
  
  // 默認提示詞
  return `根據以下設定，創作一個劇情摘要（約300字）：

世界設定：${templateWorld}

角色：
${char1Desc}
${char2Desc}

要求：
1. 描述故事從開始到高潮的發展
2. 要有張力和情緒遞進
3. 讓讀者期待故事發展

輸出：直接輸出摘要文字，無需分段或符號。`
}

// V6.0: 簡化解析 - 從自由文本提取基本信息
export function parseCharacterResponse(response: string): { char1: string; char2: string } | null {
  const text = response.trim()
  
  // 找「角色2」或第二個人名
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

// V6.0: 大綱直接返回文本
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
  callAI: (prompt: string) => Promise<string>
): Promise<{ char1: string; char2: string } | null> {
  const prompt = await buildCharacterPrompt(templateWorld)
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

// V6.0: 簡化故事生成提示詞 - 兼容舊版接口
export async function buildStoryPrompt(
  templateWorld: string,
  character1: CharacterConfig,
  character2: CharacterConfig,
  outlineBeginning: string,
  outlineDevelopment: string,
  outlineClimax: string,
  userInput?: string
): Promise<string> {
  const customPrompt = await getPromptFromDB('story')
  
  if (customPrompt) {
    return customPrompt
      .replace(/\{\{templateWorld\}\}/g, templateWorld)
      .replace(/\{\{userInput\}\}/g, userInput || '')
  }
  
  return `你是一位頂級成人小說作家。請根據以下設定創作故事：

世界設定：${templateWorld}
${userInput ? `用戶輸入：${userInput}\n` : ''}

角色1：${character1.name}，${character1.age}，${character1.role}。
角色2：${character2.name}，${character2.age}，${character2.role}。

劇情大綱：
開端：${outlineBeginning}
發展：${outlineDevelopment}
高潮：${outlineClimax}

要求：使用第一人稱，細膩描寫心理活動和場景氛圍，2500-3000字。`
}
