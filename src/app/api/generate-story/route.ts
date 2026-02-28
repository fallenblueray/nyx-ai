import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { createAdminClient } from "@/lib/supabase-admin"
import { detectPromptInjection, validateInput, detectIllegalContent, checkRateLimit } from "@/lib/security"
import { evaluateStory } from "@/lib/evaluation"
import { buildCacheKey, getCachedStory, setCachedStory } from "@/lib/redis-cache"
import crypto from "crypto"

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
    const { systemPrompt, userPrompt, model = "deepseek/deepseek-r1-0528", anonymousId, topics, characters } = await req.json()

    if (!systemPrompt || !userPrompt) {
      return NextResponse.json({ error: "缺少 prompt" }, { status: 400 })
    }

    // ============================================================
    // 安全層 1: 輸入驗證
    // ============================================================
    const validation = validateInput({
      storyInput: userPrompt,
      topics,
      characters
    })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // ============================================================
    // 安全層 2: Prompt Injection 檢測
    // ============================================================
    const combinedInput = `${systemPrompt} ${userPrompt}`
    const injectionCheck = detectPromptInjection(combinedInput)
    if (injectionCheck.isInjection) {
      console.warn(`[security] Prompt injection detected: ${injectionCheck.matchedPattern}`)
      return NextResponse.json({
        error: "輸入包含不安全內容，請修正後再試"
      }, { status: 400 })
    }

    // ============================================================
    // 安全層 3: 非法內容檢測（法律底線）
    // ============================================================
    const illegalCheck = detectIllegalContent(combinedInput)
    if (illegalCheck.isIllegal) {
      console.warn(`[security] Illegal content detected: ${illegalCheck.matchedPattern}`)
      return NextResponse.json({
        error: "系統無法處理此請求"
      }, { status: 400 })
    }

    // ============================================================
    // 安全層 4: 速率限制
    // ============================================================
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown'
    const userId = session?.user?.id
    const identifier = userId || anonymousId || clientIp
    const rateLimitType = userId ? 'loggedIn' : 'anonymous'

    const rateCheck = checkRateLimit(identifier, rateLimitType)
    if (!rateCheck.allowed) {
      return NextResponse.json({
        error: `請求過於頻繁，請 ${Math.ceil(rateCheck.resetIn / 1000)} 秒後再試`
      }, {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateCheck.resetIn / 1000))
        }
      })
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
    // 緩存層：命中則直接返回，跳過 OpenRouter 調用
    // ============================================================
    const cacheKey = buildCacheKey({ model, systemPrompt: enrichedSystemPrompt, userPrompt })
    const cached = await getCachedStory(cacheKey)

    if (cached) {
      // 緩存命中：扣字數 + 直接以 SSE 返回
      const wordsUsed = cached.content.length
      if (currentWordCount < wordsUsed) {
        return NextResponse.json({
          error: "字數不足",
          errorType: isAnonymous ? "free_quota_exceeded" : "insufficient_words",
          remaining: currentWordCount,
          required: wordsUsed
        }, { status: 402 })
      }

      // 扣字數
      if (isLoggedIn) {
        await supabase.from("profiles").update({ word_count: currentWordCount - wordsUsed }).eq("id", session!.user.id)
        updateUserPreferencesAsync(supabase, session!.user.id, wordsUsed).catch(console.warn)
      } else if (anonymousId) {
        const { data: ex } = await supabase.from("anonymous_usage").select("words_used").eq("anonymous_id", anonymousId).maybeSingle()
        await supabase.from("anonymous_usage").upsert({ anonymous_id: anonymousId, words_used: (ex?.words_used ?? 0) + wordsUsed, words_limit: FREE_WORD_LIMIT }, { onConflict: 'anonymous_id' })
      }

      // 流式輸出緩存內容
      const encoder2 = new TextEncoder()
      const cachedStream = new ReadableStream({
        start(ctrl) {
          // 分塊發送，模擬流式體驗
          const chunkSize = 50
          for (let i = 0; i < cached.content.length; i += chunkSize) {
            const chunk = cached.content.slice(i, i + chunkSize)
            ctrl.enqueue(encoder2.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
          }
          ctrl.enqueue(encoder2.encode(`data: ${JSON.stringify({ done: true, wordsUsed, remaining: currentWordCount - wordsUsed, isAnonymous, fromCache: true })}\n\n`))
          ctrl.close()
        }
      })
      return new Response(cachedStream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
      })
    }

    // ============================================================
    // 建立 Streaming Response
    // ============================================================
    const startTime = Date.now()
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

                  // ============================================================
                  // 緩存層：異步寫入 Redis（不阻塞串流）
                  // ============================================================
                  setCachedStory(cacheKey, fullContent, model).catch(console.warn)

                  // ============================================================
                  // 評估層：異步記錄 + 質量評估（不阻塞串流）
                  // ============================================================
                  const storyIdForEval = crypto.randomUUID()
                  const promptHash = crypto.createHash('sha256')
                    .update(userPrompt).digest('hex').slice(0, 16)
                  
                  // 記錄行為日誌
                  supabase.from('evaluation_logs').insert({
                    user_id: isLoggedIn ? session!.user.id : null,
                    prompt_hash: promptHash,
                    model,
                    latency_ms: Date.now() - startTime,
                    completion_tokens: wordsUsed,
                    guardrail_triggered: false,
                    is_anonymous: isAnonymous,
                  }).then()

                  // 異步質量評估（採樣 30%，節省成本）
                  if (Math.random() < 0.3) {
                    evaluateStory(storyIdForEval, {
                      content: fullContent,
                      storyInput: userPrompt,
                      topics,
                      characters,
                    }).catch(console.warn)
                  }

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
