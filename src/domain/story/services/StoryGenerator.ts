/**
 * Story Generator Service - Domain Layer
 * Handles AI story generation logic
 * V2.5: Smart Segmentation with Context Preservation
 */

import {
  findSegmentBreakPoint,
  buildContextSummary,
  formatContextForPrompt,
  shouldCompleteStory,
  ContextSummary
} from '@/lib/story-segmentation'

export interface GenerateStoryInput {
  systemPrompt: string
  userPrompt: string
  model?: string
  segmentIndex?: number
  contextSummary?: ContextSummary
}

export interface GenerateStoryOutput {
  content: string
  wordsUsed: number
  contextSummary?: ContextSummary
  isComplete?: boolean
}

export interface MultiSegmentInput {
  systemPrompt: string
  userPrompt: string
  model?: string
  targetTotalWords?: number
  maxSegments?: number
}

export interface MultiSegmentOutput {
  content: string
  wordsUsed: number
  segments: number
  contextSummary: ContextSummary
}

export class StoryGenerator {
  private readonly apiKey: string
  private readonly baseUrl = 'https://openrouter.ai/api/v1'
  private readonly referer = 'https://nyx-ai-woad.vercel.app'
  private readonly title = 'NyxAI'

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required')
    }
    this.apiKey = apiKey
  }

  async generate(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
    const { systemPrompt, userPrompt, model = 'deepseek/deepseek-r1-0528', segmentIndex = 0, contextSummary } = input
    
    if (!systemPrompt || !userPrompt) {
      throw new Error('systemPrompt and userPrompt are required')
    }

    // V2.5: 如果有上下文摘要，注入到 prompt 中
    let enrichedSystemPrompt = systemPrompt
    let enrichedUserPrompt = userPrompt
    
    if (contextSummary) {
      const contextText = formatContextForPrompt(contextSummary)
      
      // 第一段：正常生成
      // 後續段：注入上下文
      if (segmentIndex > 0) {
        enrichedSystemPrompt = `${systemPrompt}\n\n${contextText}`
        enrichedUserPrompt = `【第${segmentIndex + 1}段】\n保持風格一致，繼續上一段的劇情，直接輸出故事正文。`
      }
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': this.referer,
        'X-Title': this.title
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: enrichedSystemPrompt },
          { role: 'user', content: enrichedUserPrompt }
        ],
        max_tokens: 4000
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`API 錯誤: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    if (!content) {
      throw new Error('生成內容為空')
    }

    // 檢查是否應該完成
    const newContext = contextSummary 
      ? buildContextSummary(content, contextSummary.totalWordCount ? { ...contextSummary } : undefined)
      : buildContextSummary(content)

    const complete = shouldCompleteStory(content) || segmentIndex >= 3 // 最多4段

    return { 
      content, 
      wordsUsed: content.length,
      contextSummary: newContext,
      isComplete: complete
    }
  }

  /**
   * V2.5: 多段生成主函數
   * 智能分段，動態維護上下文
   */
  async generateMultiSegment(input: MultiSegmentInput): Promise<MultiSegmentOutput> {
    const { systemPrompt, userPrompt, model = 'deepseek/deepseek-r1-0528', targetTotalWords = 8000, maxSegments = 4 } = input
    
    let fullContent = ''
    let segmentCount = 0
    let contextSummary: ContextSummary | undefined
    let currentSegmentIndex = 0

    while (segmentCount < maxSegments) {
      // 分段 prompt
      let segmentPrompt: string
      if (segmentCount === 0) {
        // 第一段：完整設定
        segmentPrompt = userPrompt
      } else {
        // 後續段：簡化的續寫指令
        segmentPrompt = '繼續故事，保持風格和節奏一致，直接輸出。'
      }

      const result = await this.generate({
        systemPrompt,
        userPrompt: segmentPrompt,
        model,
        segmentIndex: currentSegmentIndex,
        contextSummary
      })

      // 清理重複（後段可能重複前段末尾）
      const cleanedContent = this.removeOverlap(fullContent, result.content)
      fullContent += cleanedContent
      contextSummary = result.contextSummary
      segmentCount++

      // 檢查是否完成
      if (fullContent.length >= targetTotalWords || result.isComplete) {
        break
      }

      currentSegmentIndex++
    }

    return {
      content: fullContent,
      wordsUsed: fullContent.length,
      segments: segmentCount,
      contextSummary: contextSummary || buildContextSummary(fullContent)
    }
  }

  /**
   * 移除前後段落之間的重複內容
   */
  private removeOverlap(previous: string, next: string): string {
    if (!previous || !next) return next

    // 取前段末尾300字作為比對樣本
    const prevTail = previous.slice(-300)
    
    // 檢查新段落開頭是否有重複
    for (let len = Math.min(300, next.length); len > 50; len -= 50) {
      const nextHead = next.slice(0, len)
      if (prevTail.includes(nextHead)) {
        return next.slice(len)
      }
    }

    return next
  }
}

// Factory function for dependency injection
export function createStoryGenerator(): StoryGenerator {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set')
  }
  return new StoryGenerator(apiKey)
}
