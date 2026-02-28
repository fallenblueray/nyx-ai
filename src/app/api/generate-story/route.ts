import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { createAdminClient } from "@/lib/supabase-admin"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FREE_WORD_LIMIT = 8000

// 驗證匿名 ID 格式
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

// Streaming endpoint for real-time story generation
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  try {
    const session = await getServerSession(authOptions)
    const { systemPrompt, userPrompt, model = "deepseek/deepseek-r1-0528", anonymousId } = await req.json()

    if (!systemPrompt || !userPrompt) {
      return NextResponse.json({ error: "缺少 prompt" }, { status: 400 })
    }

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API 配置錯誤" }, { status: 500 })
    }

    const supabase = createAdminClient()
    const isLoggedIn = !!session?.user?.id

    // ============================================================
    // 字數額度檢查
    // ============================================================
    let currentWordCount = 0
    let isAnonymous = false

    if (isLoggedIn) {
      // 已登入用戶：從 profiles 取字數
      const { data: profile } = await supabase
        .from("profiles")
        .select("word_count")
        .eq("id", session!.user.id)
        .single()
      currentWordCount = profile?.word_count ?? 0
    } else if (anonymousId && isValidUUID(anonymousId)) {
      // 匿名用戶：從 anonymous_usage 取字數
      isAnonymous = true
      const { data: usage } = await supabase
        .from("anonymous_usage")
        .select("words_used, words_limit")
        .eq("anonymous_id", anonymousId)
        .maybeSingle()

      const wordsUsed = usage?.words_used ?? 0
      const wordsLimit = usage?.words_limit ?? FREE_WORD_LIMIT
      currentWordCount = Math.max(0, wordsLimit - wordsUsed)
    } else {
      return NextResponse.json({ error: "請登入或提供匿名 ID" }, { status: 401 })
    }

    // ============================================================
    // 記憶層：為已登入用戶注入偏好（類 Agent RAG-like）
    // ============================================================
    let enrichedSystemPrompt = systemPrompt
    if (isLoggedIn) {
      try {
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("preferred_styles, preferred_topics, writing_style_notes")
          .eq("user_id", session!.user.id)
          .maybeSingle()

        if (prefs) {
          const memoryContext = buildMemoryContext(prefs)
          if (memoryContext) {
            enrichedSystemPrompt = `${systemPrompt}\n\n---\n[用戶偏好記憶]\n${memoryContext}`
          }
        }
      } catch (e) {
        // 記憶注入失敗不影響生成
        console.warn("[generate-story] Memory injection failed:", e)
      }
    }

    // ============================================================
    // 建立 Streaming Response
    // ============================================================
    const stream = new ReadableStream({
      async start(controller) {
        try {
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
                { role: "system", content: enrichedSystemPrompt },
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
                  const wordsUsed = fullContent.length

                  // 字數不足檢查
                  if (currentWordCount < wordsUsed) {
                    const errorType = isAnonymous ? "free_quota_exceeded" : "insufficient_words"
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      error: "字數不足",
                      errorType,
                      remaining: currentWordCount,
                      required: wordsUsed
                    })}\n\n`))
                    controller.close()
                    return
                  }

                  // 扣除字數
                  if (isLoggedIn) {
                    // 已登入：更新 profiles
                    await supabase
                      .from("profiles")
                      .update({ word_count: currentWordCount - wordsUsed })
                      .eq("id", session!.user.id)

                    // 異步更新偏好統計（不阻塞回應）
                    updateUserPreferencesAsync(supabase, session!.user.id, wordsUsed).catch(console.warn)

                  } else if (anonymousId) {
                    // 匿名：upsert anonymous_usage
                    const { data: existing } = await supabase
                      .from("anonymous_usage")
                      .select("words_used")
                      .eq("anonymous_id", anonymousId)
                      .maybeSingle()

                    const newWordsUsed = (existing?.words_used ?? 0) + wordsUsed
                    await supabase
                      .from("anonymous_usage")
                      .upsert({
                        anonymous_id: anonymousId,
                        words_used: newWordsUsed,
                        words_limit: FREE_WORD_LIMIT
                      }, { onConflict: 'anonymous_id' })
                  }

                  // 注意：不傳 content，因為流式傳輸已逐塊發送完畢
                  // 傳 content 會導致前端 double-append（顯示字數 = 實際 × 2）
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    done: true,
                    wordsUsed,
                    remaining: currentWordCount - wordsUsed,
                    isAnonymous
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
                } catch {
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

// ============================================================
// 記憶層：構建注入到 prompt 的偏好上下文
// ============================================================
function buildMemoryContext(prefs: {
  preferred_styles?: string[]
  preferred_topics?: Array<{ category: string; item: string }>
  writing_style_notes?: string
}): string {
  const parts: string[] = []

  if (prefs.preferred_styles?.length) {
    parts.push(`用戶偏好風格：${prefs.preferred_styles.join('、')}`)
  }
  if (prefs.preferred_topics?.length) {
    const topics = prefs.preferred_topics.slice(0, 3).map(t => t.item).join('、')
    parts.push(`常用題材：${topics}`)
  }
  if (prefs.writing_style_notes) {
    parts.push(`風格備注：${prefs.writing_style_notes}`)
  }

  return parts.join('\n')
}

// ============================================================
// 記憶層：異步更新用戶偏好統計（不阻塞主流程）
// ============================================================
async function updateUserPreferencesAsync(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  wordsUsed: number
) {
  try {
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("total_stories_generated, total_words_generated")
      .eq("user_id", userId)
      .maybeSingle()

    await supabase
      .from("user_preferences")
      .upsert({
        user_id: userId,
        total_stories_generated: (existing?.total_stories_generated ?? 0) + 1,
        total_words_generated: (existing?.total_words_generated ?? 0) + wordsUsed,
      }, { onConflict: 'user_id' })
  } catch (e) {
    console.warn("[updateUserPreferencesAsync] Failed:", e)
  }
}
