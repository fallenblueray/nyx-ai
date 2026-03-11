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
      max_tokens: 800,
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
  console.log('[Outline V8.2] Starting request')
  
  try {
    const body: OutlineRequest = await request.json()
    const { templateId, mode = 'full', existingCharacters, randomSeed } = body

    console.log('[Outline V8.2] Request templateId:', templateId)

    // V8.2: 優先從數據庫獲取模板
    const supabase = await createServerClient()
    let templateWorld = ''
    let templateName = ''
    let characterArchetypes = undefined
    let wordCostMultiplier = 1
    
    // 嘗試從數據庫獲取
    let dbTemplate = null
    try {
      console.log('[Outline V8.2] Querying Supabase for templateId:', templateId)
      
      // 先檢查所有模板（調試用）
      const { data: allTemplates } = await supabase.from('templates').select('id, name').limit(10)
      console.log('[Outline V8.2] Available templates:', allTemplates?.map(t => t.id) || 'none')
      
      const result = await supabase
        .from('templates')
        .select('*')
        .eq('id', templateId)
        .maybeSingle()
      
      console.log('[Outline V8.2] Supabase result:', {
        data: result.data ? `found: ${result.data.name}` : 'null',
        error: result.error ? result.error.message : 'none'
      })
      
      dbTemplate = result.data
      
      if (dbTemplate) {
        console.log('[Outline V8.2] DB template fields:', Object.keys(dbTemplate))
        console.log('[Outline V8.2] DB prompt_builder exists:', !!dbTemplate.prompt_builder)
        console.log('[Outline V8.2] DB promptBuilder exists:', !!dbTemplate.promptBuilder)
      }
    } catch (dbError: any) {
      console.error('[Outline V8.2] DB query error:', dbError.message || dbError)
    }
    
    if (dbTemplate) {
      // V8.2 FIX: Supabase 使用扁平欄位，不是 prompt_builder JSON 對象
      templateWorld = dbTemplate.base_scenario || dbTemplate.baseScenario || ''
      templateName = dbTemplate.name || ''
      wordCostMultiplier = dbTemplate.word_cost_multiplier || 1
      characterArchetypes = dbTemplate.character_archetypes || dbTemplate.characterArchetypes
      
      console.log('[Outline V8.2] Using DB template:', templateName)
      console.log('[Outline V8.2] base_scenario exists:', !!dbTemplate.base_scenario)
      console.log('[Outline V8.2] character_archetypes exists:', !!characterArchetypes)
    }
    
    // 如果數據庫沒有，回退到本地模板
    if (!templateWorld) {
      console.log('[Outline V8.2] Falling back to local template')
      const { officialTemplates } = await import('@/data/templates')
      const localTemplate = officialTemplates.find(t => t.id === templateId)
      templateWorld = localTemplate?.promptBuilder?.baseScenario || ''
      templateName = localTemplate?.name || ''
      characterArchetypes = localTemplate?.promptBuilder?.characterArchetypes
      console.log('[Outline V8.2] Using local template:', templateName)
    }
    
    if (!templateWorld) {
      return NextResponse.json(
        { success: false, error: "模板不存在或缺少基礎情境" },
        { status: 404 }
      )
    }

    let charResult: { char1: string; char2: string } | null = null
    let openingScene: string = ''

    if (mode === 'outline-only' && existingCharacters) {
      console.log('[Outline V8.2] Mode: outline-only')
      openingScene = await generateOutline(
        templateWorld,
        existingCharacters.character1,
        existingCharacters.character2,
        callAI
      )
    } else {
      console.log('[Outline V8.2] Generating characters...')
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

      console.log('[Outline V8.2] Characters generated:', charResult.char1.slice(0, 20))

      if (mode !== 'characters-only') {
        console.log('[Outline V8.2] Generating opening scene...')
        openingScene = await generateOutline(templateWorld, charResult.char1, charResult.char2, callAI)
        console.log('[Outline V8.2] Scene:', openingScene.slice(0, 50), '...')
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        characters: charResult ? {
          character1: charResult.char1,
          character2: charResult.char2,
        } : undefined,
        openingScene,
        outline: openingScene,
      }
    })

  } catch (error: any) {
    console.error("[Outline V8.2] Error:", error)
    return NextResponse.json(
      { success: false, error: error.message || "生成失败" },
      { status: 500 }
    )
  }
}
