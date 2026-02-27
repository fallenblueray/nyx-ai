import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { createAdminClient } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  try {
    // 驗證用戶登入
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登入" }, { status: 401 })
    }

    // 解析請求體
    const { systemPrompt, userPrompt, model = "deepseek/deepseek-r1-0528" } = await req.json()

    if (!systemPrompt || !userPrompt) {
      return NextResponse.json({ error: "缺少 prompt" }, { status: 400 })
    }

    // 調用 OpenRouter API（服務端，安全的 API key）
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API 配置錯誤" }, { status: 500 })
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://nyx-ai-woad.vercel.app",
        "X-Title": "NyxAI"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 4000
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ 
        error: `API 錯誤: ${response.status}`,
        details: errorData 
      }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ""

    // 計算字數並扣除
    const wordsUsed = content.length
    const supabase = createAdminClient()
    
    // 獲取當前用戶字數
    const { data: profile } = await supabase
      .from("profiles")
      .select("word_count")
      .eq("id", session.user.id)
      .single()

    const currentWordCount = profile?.word_count || 0

    if (currentWordCount < wordsUsed) {
      return NextResponse.json({ 
        error: "字數不足",
        remaining: currentWordCount,
        required: wordsUsed
      }, { status: 402 })
    }

    // 扣除字數
    await supabase
      .from("profiles")
      .update({ word_count: currentWordCount - wordsUsed })
      .eq("id", session.user.id)

    return NextResponse.json({
      content,
      wordsUsed,
      remaining: currentWordCount - wordsUsed
    })

  } catch (error) {
    console.error("[generate-story] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成失敗" },
      { status: 500 }
    )
  }
}
