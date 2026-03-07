import { NextRequest, NextResponse } from "next/server"
import { officialTemplates, type Template } from "@/data/templates"
import { generateCharacterPair, generateOutline, type CharacterConfig } from "@/lib/prompt-engine"

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
 * 調用 AI 生成角色或大綱
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
  const templateWorld = template.promptBuilder.systemPrompt || `你是一位頂級成人小說作家，專注於${template.category}題材的創作。`
  
  console.log(`[Outline] Generating for template: ${template.id}, seed: ${seed}`)
  
  // 創建帶種子的 callAI 包裝函數
  const callAIWithSeed = async (prompt: string) => {
    try {
      return await callAI(prompt, seed)
    } catch (error) {
      console.error('[Outline] callAI error:', error)
      throw error
    }
  }
  
  // Step 1: 生成角色
  const characterPair = await generateCharacterPair(templateWorld, callAIWithSeed)
  if (!characterPair) return null
  
  // Step 2: 生成大綱
  const outline = await generateOutline(
    templateWorld,
    characterPair.character1,
    characterPair.character2,
    callAIWithSeed
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
  try {
    const body: OutlineRequest = await request.json()
    const { templateId, randomSeed } = body
    
    // 查找模板
    const template = officialTemplates.find(t => t.id === templateId)
    if (!template) {
      return NextResponse.json(
        { success: false, error: "模板不存在" },
        { status: 404 }
      )
    }
    
    // 生成角色和大綱（2次 API 调用合并为 1 个逻辑）
    const data = await generateCharacterAndOutline(template, randomSeed)
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: "生成失敗，請重試" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true, data })
    
  } catch (error) {
    console.error("生成大綱失敗:", error)
    return NextResponse.json(
      { success: false, error: "服務器錯誤" },
      { status: 500 }
    )
  }
}