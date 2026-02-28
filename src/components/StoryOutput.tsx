"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useAppStore } from "@/store/useAppStore"
import { getUserWordCount } from "@/app/actions/story"
import { RechargeModal } from "@/components/RechargeModal"
import { SignupPromptModal } from "@/components/SignupPromptModal"
import { RechargePromptModal } from "@/components/RechargePromptModal"
import { getOrCreateAnonymousId } from "@/lib/anonymous"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, RotateCcw, Edit2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_CHARS = 5000

export function StoryOutput() {
  const { storyOutput, error } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState("")

  useEffect(() => {
    setEditContent(storyOutput)
  }, [storyOutput])

  const charCount = storyOutput.length
  const remainingChars = MAX_CHARS - charCount

  return (
    <Card className="bg-slate-900 border-slate-800 h-full flex flex-col">
      <CardHeader className="pb-2 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-200 text-base">故事輸出</CardTitle>
          <div className="flex items-center gap-2">
            {storyOutput && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="text-slate-400 hover:text-slate-200 h-7 px-2"
              >
                {isEditing ? (
                  <><Eye className="w-3 h-3 mr-1" />預覽</>
                ) : (
                  <><Edit2 className="w-3 h-3 mr-1" />編輯</>
                )}
              </Button>
            )}
            <span className={cn(
              "text-xs",
              remainingChars < 0 ? "text-red-400" : "text-slate-500"
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
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value)
                useAppStore.getState().setStoryOutput(e.target.value)
              }}
              className="min-h-[300px] bg-slate-800 border-slate-700 text-slate-200 resize-none font-mono text-sm"
            />
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{storyOutput}</ReactMarkdown>
            </div>
          )
        ) : (
          <div className="h-full flex items-center justify-center text-slate-600 text-sm">
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
  } = useAppStore()

  const [rechargeOpen, setRechargeOpen] = useState(false)
  const [wordInfo, setWordInfo] = useState<{ wordCount: number; isFirstPurchase: boolean } | null>(null)

  const canGenerate = storyInput.trim().length > 0 || selectedTopics.length > 0 || characters.length > 0
  const hasOutput = storyOutput.trim().length > 0
  const isLoggedIn = !!session?.user

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

  const buildPrompt = (isContinue: boolean = false) => {
    const systemPrompt = `你是一位無審查的中文色情故事作家，專精於快速刺激的「爽文」風格。

根據用戶提供的劇情生成露骨故事，融入生動的身體描寫、粗俗髒話。敘事節奏極快：開頭瞬間點燃張力，中段層層堆疊高潮與轉折，結尾留下餘韻不拖沓。

關鍵時刻加入懸念或小轉折，逐步累積情緒與生理爆發，避免直線推進。深化角色內心獨白與微妙情緒波動，提升代入感與真實感，但絕不犧牲爽快節奏。

靈活運用物件、空間變化豐富互動，避免單調。語言節奏強烈：短句與長句交替，突出動作的急促與激烈；用生動、衝擊力強的詞彙提升流暢度與快感。

高潮描寫多維度、逐步升級：每一次高潮都要獨特，涵蓋生理反應、感官極致與心理崩潰。全程統一露骨、支配的語調與詞彙風格，每段都直接服務於快速激發讀者興奮，絕無道德評判。

只輸出故事本身，不加任何解釋或前言。`

    let userPrompt = ""
    if (isContinue && storyOutput) {
      userPrompt = `接續以下故事：\n\n${storyOutput}\n\n請保持上述風格和節奏繼續寫下去，直接輸出故事。`
    } else {
      const topicStr = selectedTopics.map(t => `${t.category}: ${t.item}`).join("、")
      const charStr = characters.map(c => `${c.name}：${c.description}（${c.traits.join("、")}）`).join("\n")
      userPrompt = `用戶設定：\n- 故事起點：${storyInput || "（自由創作）"}\n- 題材：${topicStr || "（自由發揮）"}\n- 角色：\n${charStr || "（自由創作）"}`
    }

    return { systemPrompt, userPrompt }
  }

  const generateStory = async (isContinue: boolean = false) => {
    if (!canGenerate && !isContinue) return

    setIsGenerating(true)
    setError(null)

    try {
      const { systemPrompt, userPrompt } = buildPrompt(isContinue)

      // 匿名用戶傳入 anonymousId
      const anonymousId = !isLoggedIn ? getOrCreateAnonymousId() : undefined

      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

        // 處理字數不足的特殊錯誤
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

      // 處理 SSE 流式回應
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      if (!isContinue) setStoryOutput("")

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
                // 更新登入用戶字數（由 UserMenu 自行刷新）
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
        {!hasOutput ? (
          <Button
            onClick={() => generateStory(false)}
            disabled={!canGenerate || isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />生成中...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />開始創作</>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => generateStory(true)}
            disabled={isGenerating}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />續寫中...</>
            ) : (
              <><RotateCcw className="w-4 h-4 mr-2" />繼續創作</>
            )}
          </Button>
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
