/**
 * V6.0: 簡化版 Outline API - 純文本生成
 * 移除所有格式標記，直接返回自然語言描述
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

  // Generate a random seed if not provided
  const seed = randomSeed || Math.floor(Math.random() * 1000000)

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "X-Seed": seed.toString(), // Add seed header for cache busting
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 1.0, // Increase randomness
      max_tokens: 1000,
      // Add seed to body if API supports it
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
  console.log('[Outline V6] Starting request')
  
  try {
    const body: OutlineRequest = await request.json()
    const { templateId, mode = 'full', existingCharacters, randomSeed } = body

    // Try to get template from Supabase first
    let templateWorld = ''
    let templateName = ''
    let templateCategory = ''
    
    try {
      const supabase = createServerClient()
      const { data: dbTemplate, error } = await supabase
        .from('templates')
        .select('name, category, base_scenario, atmosphere, writing_style')
        .eq('id', templateId)
        .single()
      
      if (!error && dbTemplate) {
        console.log('[Outline V6] Using Supabase template:', dbTemplate.name)
        templateWorld = dbTemplate.base_scenario
        templateName = dbTemplate.name
        templateCategory = dbTemplate.category
      }
    } catch (supabaseError) {
      console.log('[Outline V6] Supabase error, falling back to local:', supabaseError)
    }
    
    // Fallback to local if Supabase not available
    if (!templateWorld) {
      const { officialTemplates } = await import('@/data/templates')
      const template = officialTemplates.find(t => t.id === templateId)
      if (!template) {
        return NextResponse.json(
          { success: false, error: "模板不存在" },
          { status: 404 }
        )
      }
      templateWorld = template.promptBuilder.baseScenario
      templateName = template.name
      templateCategory = template.category
      console.log('[Outline V6] Using local template:', templateName)
    }

    let charResult: { char1: string; char2: string } | null = null
    let outlineText: string = ''

    // V6.5: 支持不同模式
    if (mode === 'outline-only' && existingCharacters) {
      // 只生成劇情，使用提供的角色
      console.log('[Outline V6] Mode: outline-only with existing characters')
      outlineText = await generateOutline(
        templateWorld,
        existingCharacters.character1,
        existingCharacters.character2,
        callAI
      )
      console.log('[Outline V6] Outline:', outlineText.slice(0, 100), '...')
    } else {
      // 生成角色（mode !== 'outline-only'）
      console.log('[Outline V6] Generating characters with seed:', randomSeed)
      charResult = await generateCharacterPair(templateWorld, (prompt) => callAI(prompt, randomSeed))

      if (!charResult) {
        return NextResponse.json(
          { success: false, error: "角色生成失敗" },
          { status: 500 }
        )
      }

      console.log('[Outline V6] Characters:', charResult.char1.slice(0, 30), '...')

      // 如果不是只生成角色，則生成劇情
      if (mode !== 'characters-only') {
        console.log('[Outline V6] Generating outline...')
        outlineText = await generateOutline(templateWorld, charResult.char1, charResult.char2, callAI)
        console.log('[Outline V6] Outline:', outlineText.slice(0, 100), '...')
      }
    }

    // V6: 返回簡化格式
    return NextResponse.json({
      success: true,
      data: {
        characters: charResult ? {
          character1: charResult.char1,
          character2: charResult.char2,
        } : undefined,
        outline: outlineText || undefined,
      }
    })

  } catch (error: any) {
    console.error("[Outline V6] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "生成失败" },
      { status: 500 }
    )
  }
}
