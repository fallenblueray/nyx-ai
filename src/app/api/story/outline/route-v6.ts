/**
 * V6.0: 简化版 Outline API - 纯文本生成
 */

import { NextRequest, NextResponse } from "next/server"
import { officialTemplates, type Template } from "@/data/templates"
import { generateCharacterPair, generateOutline } from "@/lib/prompt-engine"

export const maxDuration = 60

interface OutlineRequest {
  templateId: string
  timestamp?: number
  randomSeed?: number
}

export async function POST(request: NextRequest) {
  console.log('[Outline V6] Starting request')
  
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
    
    const templateWorld = template.promptBuilder.baseScenario
    
    // V6: 简化调用 - 直接传递字符串而不是函数
    const charResult = await generateCharacterPair(templateWorld, async (prompt) => {
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
      
      if (!response.ok) throw new Error(`API ${response.status}`)
      const data = await response.json()
      return data.choices[0]?.message?.content || ""
    })
    
    if (!charResult) {
      return NextResponse.json(
        { success: false, error: "角色生成失败" },
        { status: 500 }
      )
    }
    
    console.log('[Outline V6] Characters:', charResult.char1.slice(0, 30), charResult.char2.slice(0, 30))
    
    // V6: 生成大纲
    const outlineText = await generateOutline(templateWorld, charResult.char1, charResult.char2, async (prompt) => {
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
          max_tokens: 800,
        }),
      })
      
      if (!response.ok) throw new Error(`API ${response.status}`)
      const data = await response.json()
      return data.choices[0]?.message?.content || ""
    })
    
    console.log('[Outline V6] Outline:', outlineText.slice(0, 100))
    
    // V6: 返回简化格式
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
    
  } catch (error: unknown) {
    console.error("[Outline V6] Error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "生成失败" },
      { status: 500 }
    )
  }
}
