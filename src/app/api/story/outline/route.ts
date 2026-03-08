/**
 * V6.0: 簡化版 Outline API - 純文本生成
 * 移除所有格式標記，直接返回自然語言描述
 */
import { NextRequest, NextResponse } from "next/server"
import { officialTemplates } from "@/data/templates"
import { generateCharacterPair, generateOutline } from "@/lib/prompt-engine"

export const maxDuration = 60

interface OutlineRequest {
  templateId: string
  timestamp?: number
  randomSeed?: number
}

async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY || ""
  const model = "openrouter/x-ai/grok-4.1-fast"
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
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
    const { templateId } = body
    
    const template = officialTemplates.find(t => t.id === templateId)
    if (!template) {
      return NextResponse.json(
        { success: false, error: "模板不存在" },
        { status: 404 }
      )
    }
    
    const templateWorld = template.promptBuilder.baseScenario
    
    // V6: 生成角色（純文本）
    console.log('[Outline V6] Generating characters...')
    const charResult = await generateCharacterPair(templateWorld, callAI)
    
    if (!charResult) {
      return NextResponse.json(
        { success: false, error: "角色生成失敗" },
        { status: 500 }
      )
    }
    
    console.log('[Outline V6] Characters:', charResult.char1.slice(0, 30), '...')
    
    // V6: 生成大綱（純文本）
    console.log('[Outline V6] Generating outline...')
    const outlineText = await generateOutline(templateWorld, charResult.char1, charResult.char2, callAI)
    
    console.log('[Outline V6] Outline:', outlineText.slice(0, 100), '...')
    
    // V6: 返回簡化格式
    return NextResponse.json({
      success: true,
      data: {
        characters: {
          character1: charResult.char1,
          character2: charResult.char2,
        },
        outline: outlineText,
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
