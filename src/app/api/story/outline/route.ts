import { NextRequest, NextResponse } from "next/server"
import { officialTemplates, type Template } from "@/data/templates"
import { generateCharacterPair, generateOutline, type CharacterConfig } from "@/lib/prompt-engine"

// V5.3.2: 延长超时时间到60秒（角色+大纲生成需要较长时间）
export const maxDuration = 60

interface OutlineRequest {
  templateId: string
  userInput?: string
  timestamp?: number
  randomSeed?: number
}

interface OutlineResponse {
  success: boolean
  data?: {
    characters: {
      character1: CharacterConfig
      character2: CharacterConfig
    }
    characterTension: string
    relationship: string
    outline: {
      beginning: string
      development: string
      climax: string
      preview: string // 只顯示給用戶的開端預覽
    }
  }
  error?: string
}

/**
 * 調用 AI 生成角色或大綱（可靠版本，使用我們已知有效的 API key）
 */
async function callAIFast(prompt: string, seed?: number): Promise<string> {
  // 使用環境變數或默認 API key
  const apiKey = process.env.OPENROUTER_API_KEY || "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"
  // 使用更快的模型（角色+大綱需要快速完成）
  const model = "openrouter/anthropic/claude-haiku-4.5"
  
  // 加入隨機種子確保每次生成不同
  const randomSeed = seed || Date.now() + Math.floor(Math.random() * 1000000)
  const promptWithSeed = `${prompt}\n\n[隨機種子: ${randomSeed}]`
  
  console.log(`[Outline] Using reliable model ${model} for prompt length: ${prompt.length}`)
  
  // 創建 25 秒超時的 AbortController（總函數限制 60 秒，需要給兩次調用留時間）
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 25000)
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: promptWithSeed }],
        temperature: 0.5,  // 進一步降低 temperature 以最快速度生成
        max_tokens: 800,     // 減少 token 確保快速生成（角色+大綱需要快速完成）
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Outline] API error (${response.status}): ${errorText.substring(0, 200)}`)
      throw new Error(`API 錯誤 ${response.status}: ${errorText.substring(0, 100)}`)
    }

    const data = await response.json()
    console.log(`[Outline] AI response received, length: ${data.choices[0]?.message?.content?.length || 0}`)
    return data.choices[0]?.message?.content || ""
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error?.name === 'AbortError') {
      console.error('[Outline] Request timeout after 30 seconds')
      throw new Error('AI 生成超時（30秒限制），請重試')
    }
    console.error('[Outline] Fetch error:', error?.message || error)
    throw error
  }
}

/**
 * 調用 AI 生成完整故事（保留 DeepSeek R1 用於最終故事生成）
 */
async function callAI(prompt: string, seed?: number): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  // V5.3: 強制使用 DeepSeek R1 模型
  const model = "deepseek/deepseek-r1-0528"
  
  // 加入隨機種子確保每次生成不同
  const randomSeed = seed || Date.now() + Math.floor(Math.random() * 1000000)
  const promptWithSeed = `${prompt}\n\n[隨機種子: ${randomSeed}]`
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: promptWithSeed }],
      temperature: 0.9,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AI API error: ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ""
}

/**
 * 合併角色和大綱生成为一次 API 调用
 */
async function generateCharacterAndOutline(
  template: Template,
  seed?: number
): Promise<OutlineResponse['data'] | null> {
  // V5.3: 使用 baseScenario 作为模板世界观，不再使用兜底默认值
  const templateWorld = template.promptBuilder.baseScenario
  
  console.log(`[Outline] Generating for template: ${template.id}, seed: ${seed}`)
  
  // 創建帶種子的 callAI 包裝函數（使用快速模型）
  const callAIFastWithSeed = async (prompt: string) => {
    try {
      console.log(`[Outline] Using fast model for prompt: ${prompt.substring(0, 100)}...`)
      return await callAIFast(prompt, seed)
    } catch (error) {
      console.error('[Outline] callAIFast error:', error)
      throw error
    }
  }
  
  // Step 1: 生成角色（使用快速模型）
  console.log(`[Outline] Step 1: Generating character pair with fast model`)
  const characterPair = await generateCharacterPair(templateWorld, callAIFastWithSeed)
  if (!characterPair) {
    console.error('[Outline] Failed to generate character pair')
    return null
  }
  console.log(`[Outline] Characters generated: ${characterPair.character1.name}, ${characterPair.character2.name}`)
  
  // Step 2: 生成大綱（使用快速模型）
  console.log(`[Outline] Step 2: Generating outline with fast model`)
  const outline = await generateOutline(
    templateWorld,
    characterPair.character1,
    characterPair.character2,
    callAIFastWithSeed
  )
  if (!outline) return null
  
  return {
    characters: {
      character1: characterPair.character1,
      character2: characterPair.character2,
    },
    characterTension: characterPair.tension,
    relationship: characterPair.relationship,
    outline: outline,
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<OutlineResponse>> {
  console.log('[Outline API] Starting POST request')
  
  try {
    const body: OutlineRequest = await request.json()
    const { templateId, randomSeed } = body
    
    console.log(`[Outline API] TemplateId: ${templateId}, Seed: ${randomSeed}`)
    
    // 查找模板
    const template = officialTemplates.find(t => t.id === templateId)
    if (!template) {
      console.error(`[Outline API] Template not found: ${templateId}`)
      return NextResponse.json(
        { success: false, error: "模板不存在" },
        { status: 404 }
      )
    }
    
    console.log(`[Outline API] Found template: ${template.name}`)
    
    // 生成角色和大綱
    const data = await generateCharacterAndOutline(template, randomSeed)
    
    if (!data) {
      console.error('[Outline API] generateCharacterAndOutline returned null')
      return NextResponse.json(
        { success: false, error: "角色或大綱生成失敗，請重試" },
        { status: 500 }
      )
    }
    
    // V5.3.3: 驗證返回數據完整性
    if (!data.characters?.character1?.name || !data.characters?.character2?.name) {
      console.error('[Outline API] Invalid character data:', data.characters)
      return NextResponse.json(
        { success: false, error: "角色數據不完整，請重試" },
        { status: 500 }
      )
    }
    
    console.log(`[Outline API] Success: characters generated (${data.characters.character1.name}, ${data.characters.character2.name})`)
    
    return NextResponse.json({ success: true, data })
    
  } catch (error: any) {
    console.error("[Outline API] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "服務器錯誤，請重試" },
      { status: 500 }
    )
  }
}