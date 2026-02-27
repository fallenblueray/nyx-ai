import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { createAdminClient } from "@/lib/supabase-admin"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Streaming endpoint for real-time story generation
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  try {
    // Validate user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登入" }, { status: 401 })
    }

    // Parse request body
    const { systemPrompt, userPrompt, model = "deepseek/deepseek-r1-0528" } = await req.json()

    if (!systemPrompt || !userPrompt) {
      return NextResponse.json({ error: "缺少 prompt" }, { status: 400 })
    }

    // Get API key
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API 配置錯誤" }, { status: 500 })
    }

    // Check word count first
    const supabase = createAdminClient()
    const { data: profile } = await supabase
      .from("profiles")
      .select("word_count")
      .eq("id", session.user.id)
      .single()

    const currentWordCount = profile?.word_count || 0

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Call OpenRouter API with streaming
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
              max_tokens: 4000,
              stream: true
            })
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `API 錯誤: ${response.status}`, details: errorData })}\n\n`))
            controller.close()
            return
          }

          if (!response.body) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "無法讀取回應" })}\n\n`))
            controller.close()
            return
          }

          let fullContent = ""

          // Process streaming response
          const reader = response.body.getReader()
          const decoder = new TextDecoder()

          while (true) {
            const { done, value } = await reader.read()
            
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                
                if (data === '[DONE]') {
                  // Stream complete - deduct words and send final message
                  const wordsUsed = fullContent.length
                  
                  if (currentWordCount < wordsUsed) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "字數不足", remaining: currentWordCount, required: wordsUsed })}\n\n`))
                    controller.close()
                    return
                  }

                  // Deduct words
                  await supabase
                    .from("profiles")
                    .update({ word_count: currentWordCount - wordsUsed })
                    .eq("id", session.user.id)

                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    done: true, 
                    content: fullContent,
                    wordsUsed,
                    remaining: currentWordCount - wordsUsed
                  })}\n\n`))
                  
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content || ''
                  if (content) {
                    fullContent += content
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          controller.close()
        } catch (error) {
          console.error("[generate-story stream] Error:", error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : "生成失敗" })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error("[generate-story] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成失敗" },
      { status: 500 }
    )
  }
}
