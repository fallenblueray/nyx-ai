/**
 * V7.0: 簡化版 Outline API - 單一場景描述
 * 大綱只返回「起始場景」，不再分開端/發展/高潮
 */
import { NextRequest, NextResponse } from "next/server"
import { generateCharacterPair, generateOutline } from "@/lib/prompt-engine"
import { createServerClient } from "@/lib/supabase/server"

export const maxDuration = 60

interface OutlineRequest {
  templateId: string
  timestamp?: number
  randomSeed?: number
  mode?: 'full' | 'characters-only' | 'outline-only'
  existingCharacters?: {
    character1: string
    character2: string
  }
}

async function callAI(prompt: string, randomSeed?: number): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY || ""
  const model = "x-ai/grok-4.1-fast"

  const seed = randomSeed || Math.floor(Math.random() * 1000000)

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "X-Seed": seed.toString(),
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 1.0,
      max_tokens: 800, // V7.0: 減少token（只生成開端場景）
      seed: seed,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API ${response.status}: ${err.slice(0, 100)}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ""
}

export async function POST(request: NextRequest) {
  console.log('[Outline V7] Starting request')
  
  try {
    const body: OutlineRequest = await request.json()
    const { templateId, mode = 'full', existingCharacters, randomSeed } = body

    // V8.1: 優先從數據庫獲取模板（包含用戶保存的角色原型）
    const supabase = createServerClient()
    let templateWorld = ''
    let templateName = ''
    let characterArchetypes = undefined
    let wordCostMultiplier = 1
    
    // 1. 嘗試從數據庫獲取
    const { data: dbTemplate } = await supabase
      .from('templates')
      .select('name, prompt_builder, word_cost_multiplier')
      .eq('id', templateId)
      .single()
    
    if (dbTemplate?.prompt_builder) {
      // 使用數據庫中的模板數據
      templateWorld = dbTemplate.prompt_builder.baseScenario || ''
      templateName = dbTemplate.name || ''
      wordCostMultiplier = dbTemplate.word_cost_multiplier || 1
      // V8.1: 使用數據庫中保存的角色原型
      characterArchetypes = dbTemplate.prompt_builder.characterArchetypes
      console.log('[Outline V8.1] Using DB template:', templateName)
      if (characterArchetypes) {
        console.log('[Outline V8.1] Using DB character archetypes:', characterArchetypes.female?.slice(0, 30), '/.../')
      }
    } else {
      // 2. 回退到本地模板
      const { officialTemplates } = await import('@/data/templates')
      const localTemplate = officialTemplates.find(t => t.id === templateId)
      templateWorld = localTemplate?.promptBuilder?.baseScenario || ''
      templateName = localTemplate?.name || ''
      characterArchetypes = localTemplate?.promptBuilder?.characterArchetypes
      console.log('[Outline V8.1] Using local template:', templateName)
    }
    
    if (!templateWorld) {
      return NextResponse.json(
        { success: false, error: "模板不存在或缺少基礎情境" },
        { status: 404 }
      )

    let charResult: { char1: string; char2: string } | null = null
    let openingScene: string = ''

    if (mode === 'outline-only' && existingCharacters) {
      // 只生成場景，使用提供的角色
      console.log('[Outline V7] Mode: outline-only')
      openingScene = await generateOutline(
        templateWorld,
        existingCharacters.character1,
        existingCharacters.character2,
        callAI
      )
    } else {
      // 生成角色
      console.log('[Outline V7] Generating characters...')
      charResult = await generateCharacterPair(
        templateWorld, 
        (prompt) => callAI(prompt, randomSeed),
        characterArchetypes
      )

      if (!charResult) {
        return NextResponse.json(
          { success: false, error: "角色生成失敗" },
          { status: 500 }
        )
      }

      console.log('[Outline V7] Characters generated:', charResult.char1.slice(0, 20))

      // 如果不是只生成角色，則生成場景
      if (mode !== 'characters-only') {
        console.log('[Outline V7] Generating opening scene...')
        openingScene = await generateOutline(templateWorld, charResult.char1, charResult.char2, callAI)
        console.log('[Outline V7] Scene:', openingScene.slice(0, 50), '...')
      }
    }

    // V7.0: 返回簡化格式（單一openingScene字段）
    return NextResponse.json({
      success: true,
      data: {
        characters: charResult ? {
          character1: charResult.char1,
          character2: charResult.char2,
        } : undefined,
        openingScene, // V7.0: 改為單一字段
        outline: openingScene, // 向後兼容：同時返回舊字段名
      }
    })

  } catch (error: any) {
    console.error("[Outline V7] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "生成失败" },
      { status: 500 }
    )
  }
}
