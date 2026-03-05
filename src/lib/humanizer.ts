/**
 * Humanizer - 去除 AI 生成痕跡
 * 基於 humanizer-zh 的核心規則實作
 */

// AI 寫作特徵檢測規則
const AI_PATTERNS = {
  // 誇大的象徵意義
  symbolic: [
    /象徵著.*?的/g,
    /代表著.*?的/g,
    /體現了.*?的/g,
    /見證了/g,
    /標誌著/g,
    /是.*?的體現/g,
    /是.*?的證明/g,
    /是.*?的提醒/g,
  ],
  // AI 流行語
  buzzwords: [
    /極其重要的/g,
    /至關重要的/g,
    /關鍵性的/g,
    /不可或缺的/g,
    /深刻反映/g,
    /凸顯了/g,
    /強調了/g,
    /彰顯了/g,
    /不斷演變的格局/g,
    /關鍵轉捩點/g,
    /不可磨滅的印記/g,
    /深深植根於/g,
  ],
  // 模糊的歸因
  vagueAttribution: [
    /有人認為/g,
    /人們普遍認為/g,
    /眾所周知/g,
    /不可否認/g,
    /顯然/g,
    /顯而易見/g,
  ],
  // 過度連接詞
  connectors: [
    /此外/g,
    /另外/g,
    /除此之外/g,
    /與此同時/g,
    /另一方面/g,
  ],
  // 三法則（三個並列）
  ruleOfThree: /[，、][^，。]{2,20}[，、][^，。]{2,20}[，、][^，。]{2,20}，/g,
}

// 替換建議
const REPLACEMENTS: Record<string, string> = {
  '極其重要的': '重要的',
  '至關重要的': '關鍵的',
  '關鍵性的': '關鍵的',
  '不可或缺的': '必要的',
  '顯而易見': '明顯',
  '眾所周知': '大家都知道',
  '不可否認': '不得不說',
  '深刻反映': '反映出',
  '凸顯了': '顯示出',
  '強調了': '說明了',
  '彰顯了': '展現了',
  '象徵著': '代表',
  '代表著': '是',
  '體現了': '表現出',
  '見證了': '經歷了',
  '標誌著': '代表',
  '不斷演變的格局': '變化的環境',
  '關鍵轉捩點': '轉折點',
  '不可磨滅的印記': '深刻印象',
  '深深植根於': '根源於',
}

/**
 * 檢測文本的 AI 痕跡分數 (0-100)
 */
export function detectAIHints(text: string): number {
  let score = 0
  let matches = 0

  // 檢測各類模式
  Object.entries(AI_PATTERNS).forEach(([category, patterns]) => {
    if (Array.isArray(patterns)) {
      patterns.forEach(pattern => {
        const match = text.match(pattern)
        if (match) {
          matches += match.length
        }
      })
    } else {
      const match = text.match(patterns)
      if (match) {
        matches += match.length
      }
    }
  })

  // 計算分數（每 100 字出現 1 次視為輕度）
  const wordCount = text.length
  const normalizedScore = (matches / Math.max(wordCount / 100, 1)) * 20
  
  return Math.min(100, Math.round(normalizedScore))
}

/**
 * Humanize 文本 - 去除 AI 痕跡
 */
export function humanizeText(text: string): string {
  let result = text

  // 1. 替換 AI 流行語
  Object.entries(REPLACEMENTS).forEach(([pattern, replacement]) => {
    const regex = new RegExp(pattern, 'g')
    result = result.replace(regex, replacement)
  })

  // 2. 簡化過度修飾
  // 移除冗長的形容詞堆疊
  result = result.replace(/非常非常的/g, '很')
  result = result.replace(/非常非常/g, '很')
  result = result.replace(/極其的/g, '很')

  // 3. 簡化連接詞開頭
  result = result.replace(/^(此外|另外|除此之外|與此同時|另一方面)[，,]?/g, '')

  // 4. 處理破折號過度使用
  // 將連續破折號簡化
  result = result.replace(/——+/g, '——')
  // 移除過多的破折號解釋
  const dashCount = (result.match(/——/g) || []).length
  if (dashCount > 3) {
    // 保留前 3 個破折號，後面的改為逗號
    let dashIndex = 0
    result = result.replace(/——/g, (match) => {
      dashIndex++
      return dashIndex <= 3 ? match : '，'
    })
  }

  // 5. 簡化象徵性描述
  result = result.replace(/是[一個]*.*?的體現[，,]?/g, '表現出')
  result = result.replace(/是[一個]*.*?的證明[，,]?/g, '說明了')
  result = result.replace(/是[一個]*.*?的提醒[，,]?/g, '讓人想起')

  return result
}

/**
 * 流式 humanize - 處理片段文本
 * 適用於 SSE 流式輸出
 */
export function humanizeChunk(chunk: string, buffer: string = ''): {
  output: string
  newBuffer: string
} {
  // 組合緩衝區和新的片段
  const combined = buffer + chunk
  
  // 尋找最後一個句子結束點（。！？）
  const lastSentenceEnd = Math.max(
    combined.lastIndexOf('。'),
    combined.lastIndexOf('！'),
    combined.lastIndexOf('？'),
    combined.lastIndexOf('\n')
  )

  // 如果沒有找到句子結束點，全部放入緩衝區
  if (lastSentenceEnd === -1) {
    return { output: '', newBuffer: combined }
  }

  // 提取可以處理的完整句子
  const processable = combined.slice(0, lastSentenceEnd + 1)
  const remaining = combined.slice(lastSentenceEnd + 1)

  // 只對完整句子進行 humanize
  const humanized = humanizeText(processable)

  return {
    output: humanized,
    newBuffer: remaining
  }
}

/**
 * 檢查文本是否需要 humanize
 */
export function shouldHumanize(text: string): boolean {
  const score = detectAIHints(text)
  return score > 30 // 分數超過 30 建議 humanize
}

/**
 * 獲取 humanize 建議報告
 */
export function getHumanizeReport(text: string): {
  aiScore: number
  shouldHumanize: boolean
  suggestions: string[]
} {
  const score = detectAIHints(text)
  const suggestions: string[] = []

  // 檢測具體問題
  if (text.match(/象徵著|代表著|體現了/)) {
    suggestions.push('減少象徵性描述，直接表達')
  }
  if (text.match(/極其重要|至關重要|關鍵性/)) {
    suggestions.push('簡化修飾詞，避免過度強調')
  }
  if (text.match(/有人認為|人們普遍認為|眾所周知/)) {
    suggestions.push('使用具體的主語，避免模糊歸因')
  }
  if ((text.match(/——/g) || []).length > 3) {
    suggestions.push('減少破折號使用，改用逗號或分句')
  }

  return {
    aiScore: score,
    shouldHumanize: score > 30,
    suggestions
  }
}