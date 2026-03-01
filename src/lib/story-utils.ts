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
