import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { createAdminClient } from "@/lib/supabase-admin"
import { detectPromptInjection, validateInput, detectIllegalContent, checkRateLimit } from "@/lib/security"
import { evaluateStory } from "@/lib/evaluation"
import { buildCacheKey, getCachedStory, setCachedStory } from "@/lib/redis-cache"
import { cleanGeneratedContent, extractPureStoryContent, cleanSegmentTransition } from "@/lib/content-cleaner"
import { buildStoryPrompt, type CharacterConfig } from "@/lib/prompt-engine"
import { officialTemplates } from "@/data/templates"
import crypto from "crypto"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FREE_WORD_LIMIT = 8000

// 驗證匿名 ID 格式
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

interface GenerateStoryRequest {
  // 新架構：使用 templateId + characters + outline
  templateId?: string
  characters?: {
    character1: CharacterConfig
    character2: CharacterConfig
  }
  outline?: {
    beginning: string
    development: string
    climax: string
  }
  userInput?: string  // 用戶自定義輸入（包含大綱）
  // 舊架構兼容（直接傳入 prompt）
  systemPrompt?: string
  userPrompt?: string
  // 通用參數
  model?: string
  anonymousId?: string
  topics?: Array<{ category: string; item: string }>
  skipCache?: boolean
}

// Streaming endpoint for real-time story generation
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()

  try {
    const session = await getServerSession(authOptions)
    const body: GenerateStoryRequest = await req.json()
    
    const { 
      templateId, 
      characters, 
      outline,
      userInput,
      systemPrompt: legacySystemPrompt, 
      userPrompt: legacyUserPrompt,
      model = "deepseek/deepseek-r1-0528", 
      anonymousId, 
      topics,
      skipCache = false
    } = body

    // ============================================================
    // 判斷使用哪種架構
    // ============================================================
    let finalSystemPrompt: string
    let finalUserPrompt: string
    
    if (templateId && characters && outline) {
      // ========== 新架構：Prompt Engine ==========
      const template = officialTemplates.find(t => t.id === templateId)
      if (!template) {
        return NextResponse.json({ error: "模板不存在" }, { status: 404 })
      }
      
      finalSystemPrompt = template.promptBuilder.systemPrompt || `你是一位頂級成人小說作家，專注於${template.category}題材的創作。`
      finalUserPrompt = await buildStoryPrompt(
        finalSystemPrompt,
        characters.character1,
        characters.character2,
        outline.beginning,
        outline.development,
        outline.climax,
        userInput || legacyUserPrompt // 優先使用 userInput（來自前端大綱），否則用 legacyUserPrompt
      )
    } else if (legacySystemPrompt && legacyUserPrompt) {
      // ========== 舊架構：直接傳入 prompt ==========
      finalSystemPrompt = legacySystemPrompt
      finalUserPrompt = legacyUserPrompt
    } else {
      return NextResponse.json({ 
        error: "缺少必要參數：請提供 templateId + characters + outline，或 systemPrompt + userPrompt" 
      }, { status: 400 })
    }

    // ============================================================
    // 安全層 1: 輸入驗證
    // ============================================================
    const validation = validateInput({
      storyInput: finalUserPrompt,
      topics,
      characters
    })
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // ============================================================
    // 安全層 2: Prompt Injection 檢測
    // ============================================================
    const combinedInput = `${finalSystemPrompt} ${finalUserPrompt}`
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("word_count")
        .eq("id", session!.user.id)
        .single()
      currentWordCount = profile?.word_count ?? 0
    } else if (anonymousId && isValidUUID(anonymousId)) {
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
    // 字數不足檢查
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
    // 記憶層：為已登入用戶注入偏好
    // ============================================================
    let enrichedSystemPrompt = finalSystemPrompt
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
            enrichedSystemPrompt = `${finalSystemPrompt}\n\n---\n[用戶偏好記憶]\n${memoryContext}`
          }
        }
      } catch (e) {
        console.warn("[generate-story] Memory injection failed:", e)
      }
    }

    // ============================================================
    // 緩存層
    // ============================================================
    let cached = null
    let cacheKey: string | null = null
    if (!skipCache) {
      cacheKey = buildCacheKey({ model, systemPrompt: enrichedSystemPrompt, userPrompt: finalUserPrompt })
      cached = await getCachedStory(cacheKey)
    }

    if (cached && !skipCache) {
      const estimatedWords = Math.ceil(cached.content.length * 0.8)
      const remainingAfterCache = currentWordCount - estimatedWords
      
      if (remainingAfterCache < 0) {
        console.warn(`[generate-story] Cache hit but insufficient words`)
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
    // V5 Prompt Engine: 單段生成模式
    // ============================================================
    const MAX_TOKENS = 4500
    const MAX_STORY_LENGTH = 2500
    const MIN_WORDS_REQUIRED = 1000

    if (currentWordCount < MIN_WORDS_REQUIRED) {
      console.warn(`[generate-story] Pre-check failed: have ${currentWordCount}`)
      const errorType = isAnonymous ? "free_quota_exceeded" : "insufficient_words"
      return NextResponse.json({
        error: isAnonymous ? "免費字數已用完，請註冊或登入" : "字數已用完，請充值",
        errorType,
        remaining: currentWordCount,
        required: MIN_WORDS_REQUIRED
      }, { status: 403 })
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
                { role: "user", content: finalUserPrompt + `\n\n[隨機種子: ${Date.now()}-${Math.floor(Math.random() * 1000000)}]` }
              ],
              max_tokens: MAX_TOKENS,
              temperature: 0.95,
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
                  // V5: 硬截斷
                  if (fullContent.length > MAX_STORY_LENGTH) {
                    const searchStart = Math.floor(MAX_STORY_LENGTH * 0.9)
                    const searchRange = fullContent.slice(searchStart, MAX_STORY_LENGTH + 100)
                    const sentenceEnd = searchRange.search(/[。！？][^」』）)]/)
                    if (sentenceEnd !== -1) {
                      fullContent = fullContent.slice(0, searchStart + sentenceEnd + 1)
                    } else {
                      fullContent = fullContent.slice(0, MAX_STORY_LENGTH)
                    }
                  }

                  // 清理內容
                  fullContent = cleanGeneratedContent(fullContent)
                  fullContent = extractPureStoryContent(fullContent)

                  const wordsUsed = Math.ceil(fullContent.length * 0.8)

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
                    await supabase
                      .from("profiles")
                      .update({ word_count: currentWordCount - wordsUsed })
                      .eq("id", session!.user.id)
                    updateUserPreferencesAsync(supabase, session!.user.id, wordsUsed).catch(console.warn)
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

                  // 模板統計
                  if (templateId) {
                    void supabase.from("template_usage_stats").insert({
                      template_id: templateId,
                      user_id: isLoggedIn ? session!.user.id : null,
                      anonymous_id: anonymousId || null,
                      word_count: wordsUsed,
                    })
                  }

                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    done: true,
                    wordsUsed,
                    remaining: currentWordCount - wordsUsed,
                    isAnonymous
                  })}\n\n`))

                  controller.close()

                  // 緩存
                  if (cacheKey) {
                    setCachedStory(cacheKey, fullContent, model).catch(console.warn)
                  }

                  // 評估
                  const storyIdForEval = crypto.randomUUID()
                  const promptHash = crypto.createHash('sha256').update(finalUserPrompt).digest('hex').slice(0, 16)
                  
                  supabase.from('evaluation_logs').insert({
                    user_id: isLoggedIn ? session!.user.id : null,
                    prompt_hash: promptHash,
                    model,
                    latency_ms: Date.now() - startTime,
                    completion_tokens: wordsUsed,
                    guardrail_triggered: false,
                    is_anonymous: isAnonymous,
                  }).then()

                  if (Math.random() < 0.3 && characters) {
                    evaluateStory(storyIdForEval, {
                      content: fullContent,
                      storyInput: finalUserPrompt,
                      topics: topics || [],
                      characters: {
                        character1: {
                          name: characters.character1.name,
                          description: characters.character1.personality,
                          traits: characters.character1.traits
                        },
                        character2: {
                          name: characters.character2.name,
                          description: characters.character2.personality,
                          traits: characters.character2.traits
                        }
                      }
                    }).catch(console.warn)
                  }

                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content || ''
                  if (content) {
                    fullContent += content
                    
                    // 實時字數檢查
                    const currentWordsUsed = Math.ceil(fullContent.length * 0.8)
                    if (currentWordsUsed > currentWordCount) {
                      const errorType = isAnonymous ? "free_quota_exceeded" : "insufficient_words"
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        error: isAnonymous ? "免費字數已用完，請註冊或登入" : "字數已用完，請充值",
                        errorType,
                        remaining: 0,
                        wordsUsed: currentWordsUsed,
                        truncated: true
                      })}\n\n`))
                      controller.close()
                      return
                    }
                    
                    // 實時硬截斷
                    if (fullContent.length > MAX_STORY_LENGTH) {
                      const searchStart = Math.floor(MAX_STORY_LENGTH * 0.9)
                      const searchRange = fullContent.slice(searchStart, MAX_STORY_LENGTH + 100)
                      const sentenceEnd = searchRange.search(/[。！？][^」』）)]/)
                      if (sentenceEnd !== -1) {
                        fullContent = fullContent.slice(0, searchStart + sentenceEnd + 1)
                      } else {
                        fullContent = fullContent.slice(0, MAX_STORY_LENGTH)
                      }
                      
                      const wordsUsed = Math.ceil(fullContent.length * 0.8)
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        done: true,
                        wordsUsed,
                        remaining: currentWordCount - wordsUsed,
                        isAnonymous,
                        truncated: true
                      })}\n\n`))
                      controller.close()
                      
                      if (isLoggedIn) {
                        await supabase.from("profiles").update({ word_count: currentWordCount - wordsUsed }).eq("id", session!.user.id)
                      } else if (anonymousId) {
                        const { data: existing } = await supabase.from("anonymous_usage").select("words_used").eq("anonymous_id", anonymousId).maybeSingle()
                        await supabase.from("anonymous_usage").upsert({
                          anonymous_id: anonymousId,
                          words_used: (existing?.words_used ?? 0) + wordsUsed,
                          words_limit: FREE_WORD_LIMIT
                        }, { onConflict: 'anonymous_id' })
                      }
                      
                      if (templateId) {
                        void supabase.from("template_usage_stats").insert({
                          template_id: templateId,
                          user_id: isLoggedIn ? session!.user.id : null,
                          anonymous_id: anonymousId || null,
                          word_count: wordsUsed,
                        })
                      }
                      
                      return
                    }
                    
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

// 記憶層：構建注入到 prompt 的偏好上下文
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

// 記憶層：異步更新用戶偏好統計
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