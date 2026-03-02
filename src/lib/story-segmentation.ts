/**
 * story-segmentation.ts
 * V2.5 智能分段生成系統
 * 無需預先生成大綱，動態檢測分段點並維護上下文
 */

export interface StorySegment {
  index: number
  content: string
  wordCount: number
  isComplete: boolean
}

export interface ContextSummary {
  characters: string[]        // 出場角色
  scene: string               // 當前場景
  mood: string               // 當前情緒/氛圍
  criticalPlot: string       // 關鍵劇情節點
  lastStyleSample: string   // 風格樣本（前段末尾200字）
  totalWordCount: number   // 累計字數
}

/**
 * 檢測自然分段點
 * 策略：尋找場景轉換、高潮結束、對話轉換等自然停頓點
 */
export function findSegmentBreakPoint(text: string, targetSegmentLength: number = 4200): number {
  // 如果文本太短，不需要分段
  if (text.length < targetSegmentLength * 0.8) {
    return -1
  }

  // 分段標記模式
  const breakPatterns = [
    /\n\n.{0,30}[。！？]\s*\n\n/g,  // 段落結束後空行
    /[。！？]\s*\n\n/g,             // 句子結束後空行
    /\n\n/g,                       // 任何空行
  ]

  // 搜索目標長度附近的自然斷點
  const searchRange = {
    min: Math.floor(targetSegmentLength * 0.85),
    max: Math.floor(targetSegmentLength * 1.15)
  }

  // 優先找高潮/場景轉換
  const climaxPatterns = [
    /射了|高潮|潮吹|內射|噴出|精液|顫抖|癱軟|痙攣/,
    /[。！？]\s*\n\n.{0,20}(休息|喘息|抱著|靠在|躺著|睡去|醒來)/,
    /[。！？]\s*\n\n.{0,20}(第二天|幾天後|一週後|過了|時間)/,
  ]

  // 先嘗試找高潮後的分段點（最佳分割點）
  for (const pattern of climaxPatterns) {
    const matches = text.slice(searchRange.min, searchRange.max).match(pattern)
    if (matches && matches.index !== undefined) {
      const pos = searchRange.min + matches.index
      // 找這個位置後的第一個段落結束
      const nextParaEnd = text.indexOf('\n\n', pos)
      if (nextParaEnd !== -1 && nextParaEnd < searchRange.max) {
        return nextParaEnd + 2
      }
    }
  }

  // 找不到高潮點，找普通段落結束
  for (const pattern of breakPatterns) {
    const regex = new RegExp(pattern.source, 'g')
    let match
    while ((match = regex.exec(text)) !== null) {
      if (match.index >= searchRange.min && match.index <= searchRange.max) {
        return match.index + match[0].length
      }
    }
  }

  // 最後手段：硬切在目標長度
  return targetSegmentLength
}

/**
 * 提取角色列表
 */
export function extractCharacters(text: string): string[] {
  // 簡單規則：找重複出現的2-4字詞，後面接人物相關動詞
  const namePattern = /([^\s，。！？]{2,4})(說|喊|喘|叫|呻吟|扭動|抱|親|摸|舔|舔舐)/g
  const names = new Map<string, number>()
  
  let match
  while ((match = namePattern.exec(text)) !== null) {
    const name = match[1]
    if (!/[我你他她它們的這那麼在是了就有]/g.test(name)) {
      names.set(name, (names.get(name) || 0) + 1)
    }
  }

  // 返回出現2次以上的名字
  return Array.from(names.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name)
}

/**
 * 提取當前場景
 */
export function extractScene(text: string): string {
  // 找最近提到的地點
  const scenePatterns = [
    /在([^，。！]{2,15})(房間|學校|公園|浴室|廁所|床上|沙發|車上|辦公室|教室|廚房|陽台|公園|電梯|電車|地鐵|酒店|旅館|溫泉|泳池)/,
    /([房間|學校|公園|浴室|廁所|床上|沙發|車上|辦公室|教室|廚房|陽台|電梯|電車|地鐵|酒店|旅館|溫泉|泳池])/,
  ]
  
  for (let i = text.length - 1; i >= 0; i--) {
    const slice = text.slice(Math.max(0, i - 100), i + 100)
    for (const pattern of scenePatterns) {
      const match = slice.match(pattern)
      if (match) {
        return match[0] || '場景延續'
      }
    }
  }
  
  return '場景延續'
}

/**
 * 提取當前情緒
 */
export function extractMood(text: string): string {
  // 分析最後500字的情感詞
  const lastSection = text.slice(-500)
  
  const arousalWords = /硬|濕|熱|軟|喘息|呻吟|顫抖|痙攣|高潮|射|潮吹|噴|爽|舒服|想要|渴望|失控|發情/.test(lastSection)
  const tenderWords = /抱|親|吻|親密|溫柔|嬌|愛|喜歡|甜蜜|依賴|依偎/.test(lastSection)
  const intenseWords = /粗暴|激烈|撞|抽插|幹|猛|快|用力|懲罰|調教|支配/.test(lastSection)

  if (intenseWords) return '激烈/粗暴'
  if (arousalWords) return '慾望高漲'
  if (tenderWords) return '溫柔/親密'
  
  return '平和延續'
}

/**
 * 提取關鍵劇情節點
 */
export function extractCriticalPlot(text: string): string {
  // 找最近的關鍵動作
  const plotPatterns = [
    /(?:剛剛|剛才|剛才完成|剛才結束|剛才發生)([^，。！]{5,30})/,
    /(?:讓|使|把)([^，。！]{5,25}(高潮|射|潮吹|噴|軟|爽))/,
  ]
  
  const lastSection = text.slice(-800)
  for (const pattern of plotPatterns) {
    const match = lastSection.match(pattern)
    if (match) {
      return match[1] || match[0]
    }
  }
  
  return '劇情延續'
}

/**
 * 提取風格樣本
 */
export function extractStyleSample(text: string, length: number = 200): string {
  return text.slice(-length).trim()
}

/**
 * 構建上下文摘要
 */
export function buildContextSummary(
  generatedText: string,
  previousSummary?: Partial<ContextSummary>
): ContextSummary {
  const characters = extractCharacters(generatedText)
  const scene = extractScene(generatedText)
  const mood = extractMood(generatedText)
  const criticalPlot = extractCriticalPlot(generatedText)
  const lastStyleSample = extractStyleSample(generatedText)
  
  // 合併之前的上下文
  return {
    characters: characters.length > 0 ? characters : (previousSummary?.characters || []),
    scene,
    mood,
    criticalPlot,
    lastStyleSample,
    totalWordCount: generatedText.length + (previousSummary?.totalWordCount || 0)
  }
}

/**
 * 格式化上下文為提示詞注入
 */
export function formatContextForPrompt(summary: ContextSummary): string {
  const parts: string[] = ['【上下文延續】']
  
  if (summary.characters.length > 0) {
    parts.push(`出場角色：${summary.characters.join('、')}`)
  }
  
  parts.push(`場景：${summary.scene}`)
  parts.push(`目前氛圍：${summary.mood}`)
  parts.push(`剛發生：${summary.criticalPlot}`)
  
  parts.push('\n【風格延續樣本】')
  parts.push(summary.lastStyleSample)
  
  return parts.join('\n')
}

/**
 * 判斷是否完成（達到目標長度或自然結尾）
 */
export function shouldCompleteStory(
  currentText: string,
  targetTotalWords: number = 8000
): boolean {
  // 檢查是否有自然結尾標誌
  const endingPatterns = [
    /[。！？]\s*\n\n[^\n]*((?:睡|睡著|夢|醒來|結束|完|下次|再見|明天|後來)[^\n]{0,30})$/,
    /[。！？]\s*\n\n[^\n]*((?:滿足|幸福|滿意|安慰)[^\n]{0,20})$/,
  ]
  
  const lastSection = currentText.slice(-500)
  for (const pattern of endingPatterns) {
    if (pattern.test(lastSection)) {
      return true
    }
  }
  
  // 檢查字數
  return currentText.length >= targetTotalWords
}
