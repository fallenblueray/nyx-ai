"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useAppStore } from "@/store/useAppStore"
import { getUserWordCount } from "@/app/actions/story"
import { RechargeModal } from "@/components/RechargeModal"
import { SignupPromptModal } from "@/components/SignupPromptModal"
import { RechargePromptModal } from "@/components/RechargePromptModal"
import { getOrCreateAnonymousId } from "@/lib/anonymous"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, RotateCcw, Edit2, Eye, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { extractDynamicContext } from "@/lib/story-utils"
import { SYSTEM_PROMPT as OFFICIAL_SYSTEM_PROMPT } from "@/app/api/story/segment/system_prompt"

const MAX_CHARS = 5000

export function StoryOutput() {
  const { storyOutput, error, isGenerating, currentSceneIndex, totalScenes, isStreaming } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEditContent(storyOutput)
  }, [storyOutput])

  // Auto-resize textarea to match content height
  const adjustTextareaHeight = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = `${ta.scrollHeight}px`
  }, [])

  useEffect(() => {
    if (isEditing) {
      // Small delay to let DOM update first
      setTimeout(adjustTextareaHeight, 10)
    }
  }, [isEditing, editContent, adjustTextareaHeight])

  const charCount = storyOutput.length
  const remainingChars = MAX_CHARS - charCount

  return (
    <Card className="nyx-surface nyx-border h-full flex flex-col">
      <CardHeader className="pb-2 border-b nyx-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="nyx-text-primary text-base">故事輸出</CardTitle>
            {isStreaming && (
              <span className="flex items-center gap-1 text-xs text-purple-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                生成中 第 {currentSceneIndex}/{totalScenes} 段
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {storyOutput && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // 標記需要重新生成
                    useAppStore.getState().setShouldRegenerate(true)
                  }}
                  className="nyx-text-muted hover:text-orange-400 h-7 px-2"
                  title="清空故事，重新開始"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />再寫一次
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="nyx-text-muted hover:nyx-text-primary h-7 px-2"
                >
                  {isEditing ? (
                    <><Eye className="w-3 h-3 mr-1" />預覽</>
                  ) : (
                    <><Edit2 className="w-3 h-3 mr-1" />編輯</>
                  )}
                </Button>
              </>
            )}
            <span className={cn(
              "text-xs",
              remainingChars < 0 ? "text-red-400" : "nyx-text-muted"
            )}>
              {charCount} / {MAX_CHARS} 字
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-auto">
        {storyOutput ? (
          isEditing ? (
            <Textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value)
                useAppStore.getState().setStoryOutput(e.target.value)
                adjustTextareaHeight()
              }}
              className="w-full nyx-input nyx-text-primary resize-none font-mono text-sm leading-relaxed overflow-hidden"
              style={{ minHeight: "400px" }}
            />
          ) : (
            <div
              ref={outputRef}
              className="nyx-text-primary text-sm leading-relaxed whitespace-pre-wrap break-words"
            >
              {storyOutput}
            </div>
          )
        ) : (
          <div className="h-full flex items-center justify-center nyx-text-muted text-sm">
            點擊「開始創作」生成故事
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function GenerateButtons() {
  const { data: session } = useSession()
  const {
    storyInput,
    selectedTopics,
    characters,
    storyOutput,
    isGenerating,
    setIsGenerating,
    setStoryOutput,
    setError,
    appendStoryOutput,
    setAnonymousWordsLeft,
    showSignupPrompt,
    setShowSignupPrompt,
    showRechargePrompt,
    setShowRechargePrompt,
    shouldRegenerate,
    extractCharacters,
    setShouldRegenerate,
  } = useAppStore()

  const [rechargeOpen, setRechargeOpen] = useState(false)
  const [wordInfo, setWordInfo] = useState<{ wordCount: number; isFirstPurchase: boolean } | null>(null)
  const [targetSegments, setTargetSegments] = useState<number>(2)  // V2.5: 目標分段數
  const [currentSegment, setCurrentSegment] = useState<number>(0)   // V2.5: 當前分段

  const canGenerate = storyInput.trim().length > 0 || selectedTopics.length > 0 || characters.length > 0
  const hasOutput = storyOutput.trim().length > 0
  const isLoggedIn = !!session?.user

  // V3: 監聽 shouldRegenerate 標記，觸發重新生成
  useEffect(() => {
    if (shouldRegenerate && canGenerate && !isGenerating) {
      setError(null)
      setShouldRegenerate(false)
      // V3: 使用分段生成流程
      generateStoryV3(true)
    }
  }, [shouldRegenerate, canGenerate, isGenerating])

  // 初始化：獲取匿名用戶剩餘字數
  useEffect(() => {
    if (!isLoggedIn) {
      const anonymousId = getOrCreateAnonymousId()
      if (anonymousId) {
        fetch(`/api/anonymous-usage?id=${anonymousId}`)
          .then(r => r.json())
          .then(data => {
            if (data.wordsLeft !== undefined) {
              setAnonymousWordsLeft(data.wordsLeft)
            }
          })
          .catch(console.warn)
      }
    }
  }, [isLoggedIn, setAnonymousWordsLeft])

  const buildPrompt = (isContinue: boolean = false, segmentCount: number = targetSegments) => {
    // V2.7: 統一使用官方 System Prompt
    const systemPrompt = OFFICIAL_SYSTEM_PROMPT

    // V2.8: 動態計算字數要求
    const wordsPerSegment = 2500
    const totalWords = segmentCount * wordsPerSegment
    
    let userPrompt = ""
    if (isContinue && storyOutput) {
      // V2.7：優化續寫prompt，明確要求2500字並強化風格錨定
      const ending = storyOutput.slice(-1800)  // 增加到1800字上下文
      const styleSample = storyOutput.slice(
        Math.max(0, storyOutput.length - 2500), 
        Math.max(800, storyOutput.length - 1500)
      )  // 取風格樣本
      
      // 提取出現過的角色
      const characterList = characters.length > 0 
        ? characters.map(c => `${c.name}：${c.description}`).join('\n')
        : '（沿用前文角色）'
      
      userPrompt = `【續寫任務 - 必須生成${wordsPerSegment}~${wordsPerSegment + 500}字】

【角色設定】（必須沿用，不可新增或遺漏）
${characterList}

【風格樣本】（必須保持相同文筆）
${styleSample.slice(0, 500)}

【前文結尾】（直接承接，嚴禁重複）
${ending}

【強制要求】
1. 字數：嚴格控制${wordsPerSegment}~${wordsPerSegment + 500}字之間，只許多不許少
2. 承接：從上文結尾下一秒開始，自然過渡，絕對禁止重複前文任何句子
3. 人物：只能使用【角色設定】中的角色，不得新增角色，不得遺漏既有角色
4. 劇情：延續前文情節發展，推動故事向更深層次推進
5. 風格：完全模仿【風格樣本】的文筆、節奏和詞彙使用習慣
6. 結構：必須包含對話、心理描寫、動作細節，段落之間空一行
7. 內容：延續前文的親密場景，增加變化和張力

只輸出故事正文，一個字都不要多。`
    } else {
      const topicStr = selectedTopics.map(t => `${t.category}: ${t.item}`).join("、")
      const charStr = characters.map(c => `${c.name}：${c.description}（${c.traits.join("、")}）`).join("\n")
      
      // V2.8: 根據段數動態生成字數要求
      let segmentDescription = ""
      if (segmentCount === 1) {
        segmentDescription = `單段完整故事，約 ${wordsPerSegment} 字`
      } else if (segmentCount === 2) {
        segmentDescription = `分 2 段，每段約 ${wordsPerSegment} 字，合計約 ${totalWords} 字`
      } else {
        segmentDescription = `分 ${segmentCount} 段，每段約 ${wordsPerSegment} 字，合計約 ${totalWords} 字`
      }
      
      userPrompt = `用戶設定：
- 故事起點：${storyInput || "（自由創作）"}
- 題材：${topicStr || "（自由發揮）"}
- 角色：
${charStr || "（自由創作）"}

【強制要求】字數：${segmentDescription}。每段必須生成 ${wordsPerSegment - 200}-${wordsPerSegment} 字，嚴格遵守，不可縮短。`
    }

    return { systemPrompt, userPrompt }
  }

  // V3: 生成隱形大綱
  const generateOutline = async (): Promise<any | null> => {
    try {
      const response = await fetch("/api/story/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story_start: storyInput,
          characters,
          genre: selectedTopics.map(t => t.category).join('、'),
          style: "流暢細膩、長篇敘事"
        })
      })

      if (!response.ok) {
        const result = await response.json()
        if (result.errorType === "free_quota_exceeded") {
          setShowSignupPrompt(true)
          return null
        }
        if (result.errorType === "insufficient_words") {
          setShowRechargePrompt(true)
          return null
        }
        throw new Error(result.error || "大綱生成失敗")
      }

      const data = await response.json()
      return data.outline
    } catch (err) {
      console.error('Outline generation failed:', err)
      return null
    }
  }

  // V3: 生成單段
  const generateSegment = async (
    sceneIndex: number,
    totalScenes: number,
    outlineScene: any,
    previousSegment?: string
  ): Promise<string | null> => {
    try {
      const anonymousId = !isLoggedIn ? getOrCreateAnonymousId() : undefined
      
      const response = await fetch("/api/story/segment", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(anonymousId && { "x-anonymous-id": anonymousId })
        },
        body: JSON.stringify({
          story_start: storyInput,
          scene_context: {
            scene_index: sceneIndex,
            total_scenes: totalScenes,
            outline: outlineScene,
            previous_segment: previousSegment,
            dynamic_context: useAppStore.getState().dynamicContext
          },
          characters,
          genre: selectedTopics.map(t => t.category).join('、'),
          style: "流暢細膩、長篇敘事"
        })
      })

      if (!response.ok) {
        const result = await response.json()
        if (result.errorType === "free_quota_exceeded") {
          setShowSignupPrompt(true)
          return null
        }
        if (result.errorType === "insufficient_words") {
          setShowRechargePrompt(true)
          return null
        }
        throw new Error(result.error || `第 ${sceneIndex} 段生成失敗`)
      }

      const data = await response.json()
      return data.segment?.text || null
    } catch (err) {
      console.error(`Segment ${sceneIndex} generation failed:`, err)
      return null
    }
  }

  // V3: 異步提取動態上下文
  const updateDynamicContextAsync = async (segmentText: string) => {
    const { dynamicContext, updateDynamicContext } = useAppStore.getState()
    const result = await extractDynamicContext(segmentText, dynamicContext)
    updateDynamicContext(result)
  }

  // V2.5: 直接多段生成（跳過大綱）
  const generateStoryDirect = async () => {
    console.log('[V2.5] generateStoryDirect started, canGenerate:', canGenerate, 'targetSegments:', targetSegments)
    if (!canGenerate) return

    const { resetStreaming } = useAppStore.getState()
    resetStreaming()
    setIsGenerating(true)
    setError(null)
    setStoryOutput("")

    try {
      const { systemPrompt, userPrompt } = buildPrompt(false)
      const anonymousId = !isLoggedIn ? getOrCreateAnonymousId() : undefined

      // V2.5: 多段模式 header
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (targetSegments > 1) {
        headers['x-multi-segment'] = 'true'
        headers['x-target-segments'] = String(targetSegments)
        console.log('[V2.5] Using multi-segment with', targetSegments, 'segments')
      }

      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers,
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          model: "deepseek/deepseek-r1-0528",
          topics: selectedTopics,
          characters,
          ...(anonymousId && { anonymousId }),
        })
      })

      if (!response.ok) {
        const result = await response.json()
        if (result.errorType === "free_quota_exceeded") {
          setShowSignupPrompt(true)
          return
        }
        if (result.errorType === "insufficient_words") {
          const info = await getUserWordCount()
          setWordInfo(info)
          setShowRechargePrompt(true)
          return
        }
        throw new Error(result.error || `API 錯誤: ${response.status}`)
      }

      // SSE 流式回應
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (!data) continue

            try {
              const parsed = JSON.parse(data)

              // V2.5: 處理分段事件
              if (parsed.segmentStart) {
                setCurrentSegment(parsed.segmentIndex)
                console.log('[V2.5] Segment', parsed.segmentIndex, 'started')
                continue
              }
              if (parsed.segmentDone) {
                console.log('[V2.5] Segment', parsed.segmentIndex, 'done, total:', parsed.totalWords)
                continue
              }

              if (parsed.error) {
                if (parsed.errorType === "free_quota_exceeded") {
                  setShowSignupPrompt(true)
                  return
                }
                if (parsed.errorType === "insufficient_words") {
                  const info = await getUserWordCount()
                  setWordInfo(info)
                  setShowRechargePrompt(true)
                  return
                }
                setError(parsed.error)
                return
              }

              if (parsed.content) {
                appendStoryOutput(parsed.content)
              }

              if (parsed.done) {
                if (parsed.isAnonymous && parsed.remaining !== undefined) {
                  setAnonymousWordsLeft(parsed.remaining)
                }
                const finalStory = useAppStore.getState().storyOutput
                if (finalStory.length > 100) {
                  extractCharacters(finalStory)
                }
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      console.error('[V2.5] Generation error:', err)
      setError(err instanceof Error ? err.message : "生成失敗，請重試")
    } finally {
      setIsGenerating(false)
      setCurrentSegment(0)
    }
  }

  // V3: 舊的故事生成流程（已棄用，改用 generateStoryDirect）
  const generateStoryV3 = async (skipCache: boolean = false) => {
    // 直接調用 V2.5 版本
    await generateStoryDirect()
  }

  // V1/V2: 續寫流程（保持原有邏輯）
  const continueStory = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const { systemPrompt, userPrompt } = buildPrompt(true)
      const anonymousId = !isLoggedIn ? getOrCreateAnonymousId() : undefined

      // V2.5: 續寫不使用多段模式（只用單段生成）
      const headers: Record<string, string> = { "Content-Type": "application/json" }

      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers,
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          model: "deepseek/deepseek-r1-0528",
          topics: selectedTopics,
          characters,
          ...(anonymousId && { anonymousId }),
        })
      })

      if (!response.ok) {
        const result = await response.json()
        if (result.errorType === "free_quota_exceeded") {
          setShowSignupPrompt(true)
          return
        }
        if (result.errorType === "insufficient_words") {
          const info = await getUserWordCount()
          setWordInfo(info)
          setShowRechargePrompt(true)
          return
        }
        throw new Error(result.error || `API 錯誤: ${response.status}`)
      }

      // SSE 流式回應
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (!data) continue

            try {
              const parsed = JSON.parse(data)

              // V2.5: 處理分段事件
              if (parsed.segmentStart) {
                setCurrentSegment(parsed.segmentIndex)
                continue
              }
              if (parsed.segmentDone) {
                console.log(`[分段 ${parsed.segmentIndex}] 完成，累積字數：${parsed.totalWords}`)
                continue
              }

              if (parsed.error) {
                if (parsed.errorType === "free_quota_exceeded") {
                  setShowSignupPrompt(true)
                  return
                }
                if (parsed.errorType === "insufficient_words") {
                  const info = await getUserWordCount()
                  setWordInfo(info)
                  setShowRechargePrompt(true)
                  return
                }
                setError(parsed.error)
                return
              }

              if (parsed.content) {
                appendStoryOutput(parsed.content)
              }

              if (parsed.done) {
                // 更新匿名用戶剩餘字數
                if (parsed.isAnonymous && parsed.remaining !== undefined) {
                  setAnonymousWordsLeft(parsed.remaining)
                }
                
                // 後台異步提取角色
                const currentStory = useAppStore.getState().storyOutput
                if (currentStory.length > 100) {
                  extractCharacters(currentStory)
                }
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失敗，請重試")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <div className="space-y-2">
        {/* V2.5: 分段選擇器 */}
        {!hasOutput && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs nyx-text-secondary">分段：</span>
            <div className="flex gap-1">
              {[1, 2, 3].map(seg => (
                <button
                  key={seg}
                  onClick={() => setTargetSegments(seg)}
                  disabled={isGenerating}
                  className={`px-2 py-1 text-xs rounded ${
                    targetSegments === seg 
                      ? 'bg-purple-600 text-white' 
                      : 'nyx-surface-2 nyx-text-secondary hover:nyx-text-primary'
                  }`}
                >
                  {seg}段
                </button>
              ))}
            </div>
            {isGenerating && currentSegment > 0 && (
              <span className="text-xs text-purple-400">
                第{currentSegment}段生成中...
              </span>
            )}
          </div>
        )}

        {!hasOutput ? (
          // 未有故事：顯示「開始創作」
          <Button
            onClick={() => generateStoryV3(false)}
            disabled={!canGenerate || isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{currentSegment > 0 ? `第${currentSegment}段...` : '生成中...'}</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />{targetSegments > 1 ? `開始創作（${targetSegments}段）` : '開始創作'}</>
            )}
          </Button>
        ) : (
          // 已有故事：「繼續創作」+ 「再寫一次」並排
          <div className="flex gap-2">
            <Button
              onClick={() => continueStory()}
              disabled={isGenerating}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />續寫中...</>
              ) : (
                <><RotateCcw className="w-4 h-4 mr-2" />繼續創作</>
              )}
            </Button>
            <Button
              onClick={() => {
                // 標記需要重新生成
                useAppStore.getState().setShouldRegenerate(true)
              }}
              disabled={isGenerating}
              variant="outline"
              className="flex-1 nyx-border nyx-text-secondary hover:text-orange-400"
            >
              <RefreshCw className="w-4 h-4 mr-2" />再寫一次
            </Button>
          </div>
        )}
      </div>

      {/* 匿名字數用完 → 註冊提醒 */}
      <SignupPromptModal
        open={showSignupPrompt}
        onClose={() => setShowSignupPrompt(false)}
      />

      {/* 登入用戶字數用完 → 充值提醒 */}
      <RechargePromptModal
        open={showRechargePrompt}
        onClose={() => setShowRechargePrompt(false)}
        isFirstPurchase={wordInfo?.isFirstPurchase ?? true}
        onRecharge={() => setRechargeOpen(true)}
      />

      {/* 完整充值 Modal */}
      {wordInfo && (
        <RechargeModal
          open={rechargeOpen}
          onClose={() => setRechargeOpen(false)}
          isFirstPurchase={wordInfo.isFirstPurchase}
          wordCount={wordInfo.wordCount}
        />
      )}
    </>
  )
}
