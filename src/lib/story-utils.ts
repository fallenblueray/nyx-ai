/**
 * story-utils.ts
 * 故事處理工具函數 — V1 規則摘要
 * V2 預留：LLM 精細摘要 + 角色提取
 */

/**
 * 從完整故事中提取續寫用摘要（規則式，零延遲）
 *
 * 策略：
 * - 開頭 2 段（交代主角 & 場景）
 * - 省略號連接
 * - 最後 5 段（保留最新劇情走向）
 * - 總長度限制在 maxLength 字以內
 */
export function summarizeStory(fullText: string, maxLength: number = 600): string {
  if (fullText.length <= maxLength) return fullText

  // 以空行分段（故事格式：每段空一行）
  const paragraphs = fullText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)

  if (paragraphs.length <= 8) {
    // 段落少：直接截取尾部
    return fullText.slice(-maxLength)
  }

  // 開頭 2 段
  const head = paragraphs.slice(0, 2).join('\n\n')
  // 最後 5 段
  const tail = paragraphs.slice(-5).join('\n\n')

  const combined = `${head}\n\n……（中段略）……\n\n${tail}`

  // 如果組合後仍太長，優先保留尾部
  if (combined.length > maxLength) {
    return ('……（前文略）……\n\n' + tail).slice(0, maxLength)
  }

  return combined
}

/**
 * 提取故事中出現的角色列表（V1 簡單規則版）
 * V2 將改用 LLM 精確提取
 *
 * 規則：在直接引語或特定稱謂前後識別人名
 * 限制：只適合簡單命名的角色，複雜劇情請等 V2
 */
export function extractCharacterNames(fullText: string): string[] {
  // 常見名字模式：2-4 字詞 + 特定後綴（姐、哥、小、醫生等）
  const patterns = [
    /「([^「」]{1,4})[」：:]/g,   // 引號前的名字
    /([^\s，。！？]{1,4})(說道|喊道|低聲|嬌喘|叫道)/g,  // 動詞前的名字
  ]

  const names = new Set<string>()
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(fullText)) !== null) {
      const name = match[1].trim()
      // 過濾無效項目（太短、包含特殊字符等）
      if (name.length >= 2 && !/[我你他她它們]/.test(name)) {
        names.add(name)
      }
    }
  }

  return Array.from(names).slice(0, 5) // 最多返回 5 個角色
}

/**
 * V3: 提取動態上下文（異步進行）
 * 
 * 分析新故事段落，提取：
 * - 新出現的角色（帶情緒狀態）
 * - 關係發展變化
 * - 關鍵道具/線索
 * 
 * 此函數在後台調用，不阻塞用戶體驗
 */
export interface DynamicContext {
  characters: {
    name: string
    mood: string
    status: string
    isNew: boolean
  }[]
  relationships: string[]
  keyItems: string[]
}

export async function extractDynamicContext(
  newSegment: string,
  existingContext: DynamicContext
): Promise<DynamicContext> {
  try {
    const response = await fetch('/api/extract-dynamic-context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        segment: newSegment,
        existingCharacters: existingContext.characters.map(c => c.name)
      })
    })

    if (!response.ok) {
      // 失敗時返回現有上下文，不影響流程
      return existingContext
    }

    const data = await response.json()
    
    // 合併新舊角色（保持原有角色的最新狀態）
    const mergedCharacters = [...existingContext.characters]
    
    for (const newChar of data.characters || []) {
      const existingIndex = mergedCharacters.findIndex(c => c.name === newChar.name)
      if (existingIndex >= 0) {
        // 更新現有角色狀態
        mergedCharacters[existingIndex] = { ...mergedCharacters[existingIndex], ...newChar, isNew: false }
      } else {
        // 添加新角色
        mergedCharacters.push({ ...newChar, isNew: true })
      }
    }

    // 合併關係和道具（去重）
    const mergedRelationships = Array.from(new Set([
      ...existingContext.relationships,
      ...(data.relationships || [])
    ]))

    const mergedKeyItems = Array.from(new Set([
      ...existingContext.keyItems,
      ...(data.keyItems || [])
    ]))

    return {
      characters: mergedCharacters.slice(0, 8), // 最多 8 個角色
      relationships: mergedRelationships.slice(0, 10),
      keyItems: mergedKeyItems.slice(0, 6)
    }
  } catch (err) {
    console.warn('[extractDynamicContext] Failed:', err)
    // 失敗靜默處理，返回原上下文
    return existingContext
  }
}

/**
 * V3: 快速規則摘要（用於段間銜接）
 * 提取段落的關鍵信息，用於下一段的 prompt
 */
export function extractSegmentSummary(segmentText: string): {
  endingSnippet: string
  mood: string
  keyEvents: string[]
} {
  // 提取最後 300 字作為銜接引子
  const endingSnippet = segmentText.slice(-300)
  
  // 簡單情緒檢測
  const moodKeywords: Record<string, string[]> = {
    '緊張': ['緊張', '焦慮', '急促', '慌張', '危險'],
    '浪漫': ['溫柔', '愛意', '凝視', '親吻', '擁抱'],
    '悲傷': ['淚水', '哭泣', '絕望', '心痛', '離別'],
    '興奮': ['興奮', '激動', '喜悅', '歡呼', '期待'],
    '恐懼': ['恐懼', '害怕', '顫抖', '恐怖', '驚嚇'],
    '平靜': ['平靜', '安靜', '輕鬆', '舒適', '溫馨']
  }
  
  let detectedMood = '平穩'
  for (const [mood, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some(kw => segmentText.includes(kw))) {
      detectedMood = mood
      break
    }
  }
  
  return {
    endingSnippet,
    mood: detectedMood,
    keyEvents: [] // LLM 提取更準確
  }
}
