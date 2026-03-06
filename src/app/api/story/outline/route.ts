"use server"

import { NextRequest, NextResponse } from "next/server"
import { officialTemplates, type Template } from "@/data/templates"
import { generateCharacterPair, generateOutline, type CharacterConfig } from "@/lib/prompt-engine"

interface OutlineRequest {
  templateId: string
  userInput?: string
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
async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.STORY_GENERATION_MODEL || "openrouter/deepseek/deepseek-chat-v3-0324"
  
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
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
  template: Template
): Promise<OutlineResponse['data'] | null> {
  const templateWorld = template.promptBuilder.systemPrompt || `你是一位頂級成人小說作家，專注於${template.category}題材的創作。`
  
  // Step 1: 生成角色
  const characterPair = await generateCharacterPair(templateWorld, callAI)
  if (!characterPair) return null
  
  // Step 2: 生成大綱
  const outline = await generateOutline(
    templateWorld,
    characterPair.character1,
    characterPair.character2,
    callAI
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
    const { templateId } = body
    
    // 查找模板
    const template = officialTemplates.find(t => t.id === templateId)
    if (!template) {
      return NextResponse.json(
        { success: false, error: "模板不存在" },
        { status: 404 }
      )
    }
    
    // 生成角色和大綱（2次 API 调用合并为 1 个逻辑）
    const data = await generateCharacterAndOutline(template)
    
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