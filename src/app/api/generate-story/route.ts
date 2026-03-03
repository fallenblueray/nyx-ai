import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { createAdminClient } from "@/lib/supabase-admin"
import { detectPromptInjection, validateInput, detectIllegalContent, checkRateLimit } from "@/lib/security"
import { evaluateStory } from "@/lib/evaluation"
import { buildCacheKey, getCachedStory, setCachedStory } from "@/lib/redis-cache"
import { cleanGeneratedContent, extractPureStoryContent, cleanSegmentTransition } from "@/lib/content-cleaner"
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
    const { systemPrompt, userPrompt, model = "deepseek/deepseek-r1-0528", anonymousId, topics, characters, skipCache = false } = await req.json()

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
    // 字數不足檢查：負數或零時禁止生成
    // ============================================================
    if (currentWordCount <= 0) {
      console.warn(`[generate-story] Insufficient words: ${currentWordCount}`)
      if (isAnonymous) {
        return NextResponse.json({ 
          error: "免費字數已用完，請註冊或登入", 
          errorType: "free_quota_exceeded",
          remaining: 0 
        }, { status: 403 })
      } else {
        return NextResponse.json({ 
          error: "字數已用完，請充值", 
          errorType: "insufficient_words",
          remaining: 0 
        }, { status: 403 })
      }
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
    // 如果 skipCache 為 true，則跳過緩存層，強制重新生成
    let cached = null
    let cacheKey: string | null = null
    if (!skipCache) {
      cacheKey = buildCacheKey({ model, systemPrompt: enrichedSystemPrompt, userPrompt })
      cached = await getCachedStory(cacheKey)
    }

    if (cached && !skipCache) {
      // 緩存命中：扣字數 + 直接以 SSE 返回
      // 注意：cached.content.length 是字元數，currentWordCount 是剩餘字數
      // 評估時用字元數 * 0.8 轉換為字數（保守估計）
      const estimatedWords = Math.ceil(cached.content.length * 0.8)
      const remainingAfterCache = currentWordCount - estimatedWords
      
      if (remainingAfterCache < 0) {
        console.warn(`[generate-story] Cache hit but insufficient words: have ${currentWordCount}, need ~${estimatedWords}`)
        // 字數不足，跳過緩存，讓用戶生成新故事
      } else {
        // 扣字數
        if (isLoggedIn) {
          await supabase.from("profiles").update({ word_count: remainingAfterCache }).eq("id", session!.user.id)
          updateUserPreferencesAsync(supabase, session!.user.id, estimatedWords).catch(console.warn)
        } else if (anonymousId) {
          const { data: ex } = await supabase.from("anonymous_usage").select("words_used").eq("anonymous_id", anonymousId).maybeSingle()
          await supabase.from("anonymous_usage").upsert({ anonymous_id: anonymousId, words_used: (ex?.words_used ?? 0) + estimatedWords, words_limit: FREE_WORD_LIMIT }, { onConflict: 'anonymous_id' })
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
            ctrl.enqueue(encoder2.encode(`data: ${JSON.stringify({ done: true, wordsUsed: estimatedWords, remaining: remainingAfterCache, isAnonymous, fromCache: true })}\n\n`))
            ctrl.close()
          }
        })
        return new Response(cachedStream, {
          headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' }
        })
      }
    }

    // ============================================================
    // V2.5: 多段生成模式
    // ============================================================
    const enableMultiSegment = req.headers.get('x-multi-segment') === 'true'
    const targetSegments = parseInt(req.headers.get('x-target-segments') || '2', 10)
    
    // 多段模式只用於首次生成，不適用於續寫
    if (enableMultiSegment) {
      return handleMultiSegmentGeneration(req, {
        systemPrompt: enrichedSystemPrompt,
        userPrompt,
        model,
        targetSegments: Math.min(Math.max(targetSegments, 2), 4),
        isLoggedIn,
        session,
        anonymousId,
        currentWordCount,
        supabase,
        isAnonymous
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
                  // 字數估算：使用字元數 * 0.8 轉換為字數（中文約等於）
                  const wordsUsed = Math.ceil(fullContent.length * 0.8)

                  // 字數不足檢查
                  if (currentWordCount < wordsUsed) {
                    const errorType = isAnonymous ? "free_quota_exceeded" : "insufficient_words"
                    console.warn(`[generate-story] Generated story too long: have ${currentWordCount}, need ~${wordsUsed}`)
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
            if (cacheKey) {
              setCachedStory(cacheKey, fullContent, model).catch(console.warn)
            }

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
// V2.5: 多段生成處理函數
// ============================================================
async function handleMultiSegmentGeneration(
  req: NextRequest,
  options: {
    systemPrompt: string
    userPrompt: string
    model: string
    targetSegments: number
    isLoggedIn: boolean
    session: any
    anonymousId?: string
    currentWordCount: number
    supabase: ReturnType<typeof createAdminClient>
    isAnonymous: boolean
  }
) {
  const { 
    systemPrompt, 
    userPrompt, 
    model, 
    targetSegments,
    isLoggedIn,
    session,
    anonymousId,
    currentWordCount,
    supabase,
    isAnonymous
  } = options

  const encoder = new TextEncoder()
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: "API 配置錯誤" }, { status: 500 })
  }

  // 上下文狀態
  let contextState = {
    previousContent: '',
    segmentIndex: 0,
    totalWordsUsed: 0
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (let seg = 0; seg < targetSegments; seg++) {
          contextState.segmentIndex = seg
          
          // 構建該段的 prompt
          let segmentUserPrompt: string
          if (seg === 0) {
            segmentUserPrompt = userPrompt
          } else {
            // 後續段：提取上下文並注入
            const context = extractContextForSegment(contextState.previousContent)
            segmentUserPrompt = `${context}

【任務】繼續保持上述風格、人物設定和節奏，直接輸出故事正文。
【字數要求】約 2300-2500 字，嚴格遵守，不可超過。
【禁止】重複前文內容、使用分段標記、輸出思考過程。`
          }

          // 發送分段開始信號
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            segmentStart: true, 
            segmentIndex: seg + 1, 
            totalSegments: targetSegments 
          })}\n\n`))

          // 調用 OpenRouter
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
                { role: "user", content: segmentUserPrompt }
              ],
              max_tokens: 4500,
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

          let segmentContent = ""
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
                  // 該段完成
                  // 清理內容：移除 AI 思考內容和分段標記
                  let cleanedSegment = cleanGeneratedContent(segmentContent)
                  cleanedSegment = extractPureStoryContent(cleanedSegment)
                  cleanedSegment = cleanSegmentTransition(cleanedSegment)
                  
                  // 硬截斷：確保每段不超過 2800 字（目標 2500）
                  const MAX_SEGMENT_LENGTH = 2800
                  if (cleanedSegment.length > MAX_SEGMENT_LENGTH) {
                    cleanedSegment = truncateToTarget(cleanedSegment, 2500)
                  }
                  
                  // 移除重疊內容
                  cleanedSegment = removeOverlap(contextState.previousContent, cleanedSegment)
                  contextState.previousContent += cleanedSegment
                  contextState.totalWordsUsed += cleanedSegment.length
                  
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                    segmentDone: true, 
                    segmentIndex: seg + 1,
                    segmentWords: cleanedSegment.length,
                    totalWords: contextState.totalWordsUsed
                  })}\n\n`))
                  break
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content || ''
                  if (content) {
                    segmentContent += content
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
                  }
                } catch {
                  // Skip invalid JSON
                }
              }
            }
          }

          // 檢查是否完成（字數足夠或是最後一段）
          if (contextState.totalWordsUsed >= currentWordCount * 0.9 || seg === targetSegments - 1) {
            break
          }
        }

        // 全部完成：扣除字數
        const wordsUsed = Math.ceil(contextState.totalWordsUsed * 0.8)
        
        if (isLoggedIn) {
          await supabase
            .from("profiles")
            .update({ word_count: Math.max(0, currentWordCount - wordsUsed) })
            .eq("id", session.user.id)
        } else if (anonymousId) {
          const { data: existing } = await supabase
            .from("anonymous_usage")
            .select("words_used")
            .eq("anonymous_id", anonymousId)
            .maybeSingle()

          await supabase
            .from("anonymous_usage")
            .upsert({
              anonymous_id: anonymousId,
              words_used: (existing?.words_used ?? 0) + wordsUsed,
              words_limit: FREE_WORD_LIMIT
            }, { onConflict: 'anonymous_id' })
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          done: true,
          wordsUsed,
          remaining: currentWordCount - wordsUsed,
          isAnonymous,
          totalSegments: targetSegments,
          finalWordCount: contextState.totalWordsUsed
        })}\n\n`))

        controller.close()

      } catch (error) {
        console.error("[multi-segment] Error:", error)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : "多段生成失敗" })}\n\n`))
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
}

// 從前段內容提取上下文（V2.5 改進版）
function extractContextForSegment(previousContent: string): string {
  if (!previousContent) return ''

  // 取中段 300 字作為風格樣本（比結尾更能代表整體風格）
  const midPoint = Math.floor(previousContent.length / 2)
  const midSample = previousContent.slice(midPoint - 150, midPoint + 150)
  
  // 取末尾 400 字作為銜接點
  const tail = previousContent.slice(-400)
  
  // 找角色名（從全文中提取，不只尾巴）
  const namePattern = /「([^」]{2,4})」|([^\s，。]{2,4})(說|喊|喘|叫|嬌|呻吟|扭動|抱|親|摸)/g
  const names = new Map<string, number>()
  let match
  while ((match = namePattern.exec(previousContent)) !== null) {
    const name = match[1] || match[2]
    if (name && !/[我你他她它這那麼的在是了就]/.test(name)) {
      names.set(name, (names.get(name) || 0) + 1)
    }
  }
  
  // 按出現頻率排序，取前 3
  const topNames = Array.from(names.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)

  let context = '【前文輪廓】\n'
  if (topNames.length > 0) {
    context += `主要角色：${topNames.join('、')}\n`
  }
  context += `累計進度：約 ${Math.floor(previousContent.length / 100) / 10} 千字\n\n`
  
  context += '【風格樣本】（維持此風格）\n'
  context += midSample.slice(0, 200) + '\n\n'
  
  context += '【銜接點】（直接接續）\n'
  context += tail.slice(-150)

  return context
}

// 硬截斷到目標長度
function truncateToTarget(content: string, targetLength: number): string {
  if (content.length <= targetLength) return content
  
  // 找目標長度附近的句子結束點
  const searchStart = Math.floor(targetLength * 0.9)
  const searchEnd = Math.min(content.length, targetLength + 200)
  const searchRange = content.slice(searchStart, searchEnd)
  
  // 找最近的自然斷點
  const sentenceEnds: RegExpExecArray[] = []
  const pattern = /[。！？][^」』）)]/g
  let matchResult: RegExpExecArray | null
  while ((matchResult = pattern.exec(searchRange)) !== null) {
    sentenceEnds.push(matchResult)
  }
  
  if (sentenceEnds.length > 0) {
    const targetPos = targetLength - searchStart
    const bestMatch = sentenceEnds.reduce((closest, match) => {
      const matchPos = match.index ?? 0
      const closestPos = closest.index ?? 0
      return Math.abs(matchPos - targetPos) < Math.abs(closestPos - targetPos) ? match : closest
    })
    
    const cutPoint = searchStart + (bestMatch.index ?? 0) + 1
    return content.slice(0, cutPoint)
  }
  
  // 找不到斷點，硬切
  return content.slice(0, targetLength)
}

// 移除重疊內容
function removeOverlap(previous: string, next: string): string {
  if (!previous || !next) return next

  const prevTail = previous.slice(-200)
  for (let len = Math.min(200, next.length); len > 30; len -= 20) {
    const nextHead = next.slice(0, len)
    if (prevTail.includes(nextHead)) {
      return next.slice(len)
    }
  }
  return next
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
