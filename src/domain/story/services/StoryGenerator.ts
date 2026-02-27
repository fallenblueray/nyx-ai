/**
 * Story Generator Service - Domain Layer
 * Handles AI story generation logic
 */

export interface GenerateStoryInput {
  systemPrompt: string
  userPrompt: string
  model?: string
}

export interface GenerateStoryOutput {
  content: string
  wordsUsed: number
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
    const { systemPrompt, userPrompt, model = 'deepseek/deepseek-r1-0528' } = input

    if (!systemPrompt || !userPrompt) {
      throw new Error('systemPrompt and userPrompt are required')
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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
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

    return {
      content,
      wordsUsed: content.length
    }
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
