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
import { Loader2, Sparkles, RotateCcw, Edit2, Eye, RefreshCw, Download, FileText, Copy, Check, BookOpen, Wand2, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { extractDynamicContext } from "@/lib/story-utils"
import { SYSTEM_PROMPT as OFFICIAL_SYSTEM_PROMPT } from "@/app/api/story/segment/system_prompt"
import { getThemeById } from "@/lib/themes"

const MAX_CHARS = 5000

// 錯誤顯示組件
function ErrorDisplay({ 
  error, 
  onDismiss 
}: { 
  error: string
  onDismiss: () => void
}) {
  // 根據錯誤類型顯示不同的圖標和建議
  const getErrorInfo = (err: string) => {
    if (err.includes('字數') || err.includes('quota') || err.includes('額度')) {
      return {
        icon: <AlertCircle className="w-5 h-5 text-orange-400" />,
        title: '字數不足',
        action: '充值或登入以繼續使用'
      }
    }
    if (err.includes('network') || err.includes('連線') || err.includes('timeout')) {
      return {
        icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
        title: '連線問題',
        action: '檢查網絡後重試'
      }
    }
    return {
      icon: <AlertCircle className="w-5 h-5 text-red-400" />,
      title: '生成失敗',
      action: '請重試或稍後再試'
    }
  }
  
  const info = getErrorInfo(error)
  
  return (
    <div className="mt-4 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
      <div className="flex items-start gap-3">
        {info.icon}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-medium text-red-300">{info.title}</p>
            <button 
              onClick={onDismiss}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-red-400/80 mt-1">{error}</p>
          <p className="text-xs text-red-400/60 mt-2">{info.action}</p>
        </div>
      </div>
    </div>
  )
}

// 生成進度條組件
function GenerationProgress({
  isGenerating,
  currentSegment,
  totalSegments,
  contentLength,
  targetTotalLength = 5000
}: {
  isGenerating: boolean
  currentSegment: number
  totalSegments: number
  contentLength: number
  targetTotalLength?: number
}) {
  if (!isGenerating) return null

  // V2.9: 基於實際內容長度計算進度
  // 每段目標約 2500 字，總目標 = 段數 × 2500
  const TARGET_PER_SEGMENT = 2500
  const totalTarget = TARGET_PER_SEGMENT  // V4: 單段生成，固定 2500 字目標

  // 計算進度：實際字數 / 總目標字數，最高 95%（保留 5% 給最後處理）
  const contentProgress = Math.min(95, (contentLength / totalTarget) * 100)

  // 如果當前段已完成但字數未達標，根據段數進度補償
  const segmentProgress = ((currentSegment || 1) / totalSegments) * 100

  // 取兩者較大值，但確保進度是遞增的
  let totalProgress = Math.max(contentProgress, segmentProgress * 0.8)

  // 確保進度不會倒退
  totalProgress = Math.min(95, Math.max(5, totalProgress))

  // V4: 簡化狀態文字，移除分段顯示
  let statusText = ""
  if (contentLength >= totalTarget * 0.95) {
    statusText = "整理輸出..."
  } else {
    statusText = `已生成 ${contentLength.toLocaleString()} 字`
  }

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-purple-400">
        <span className="flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          {statusText}
        </span>
        <span>{Math.round(totalProgress)}%</span>
      </div>
      <div className="w-full h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, totalProgress)}%` }}
        />
      </div>
    </div>
  )
}

// 導出功能組件
function ExportButtons({ content, title }: { content: string; title?: string }) {
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // V2.9: Word 導出
  const handleDownloadWord = async () => {
    setExporting(true)
    try {
      const { exportStoryToWord, downloadBlob } = await import('@/lib/export-word')
      const blob = await exportStoryToWord(content, {
        title: title || 'NyxAI 故事',
        createdAt: new Date(),
        wordCount: content.length
      })
      downloadBlob(blob, `${title || 'story'}_${new Date().toISOString().slice(0,10)}.docx`)
    } catch (error) {
      console.error('Word export failed:', error)
      alert('導出失敗，請重試')
    } finally {
      setExporting(false)
    }
  }
  
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-7 px-2 nyx-text-muted hover:nyx-text-primary"
        title="複製全文"
      >
        {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownloadWord}
        disabled={exporting}
        className="h-7 px-2 nyx-text-muted hover:nyx-text-primary"
        title="下載 Word 文檔"
      >
        {exporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
      </Button>
    </div>
  )
}

// 空狀態引導組件
function EmptyState({ 
  hasInput, 
  isGenerating 
}: { 
  hasInput: boolean
  isGenerating: boolean
}) {
  if (isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center nyx-text-muted">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-purple-400" />
        <p className="text-sm">正在準備生成...</p>
      </div>
    )
  }
  
  if (hasInput) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full nyx-surface-2 flex items-center justify-center">
            <Wand2 className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <p className="nyx-text-primary font-medium">準備就緒</p>
            <p className="text-sm nyx-text-muted mt-1">設定已完成，點擊「開始創作」生成故事</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="text-center space-y-4 max-w-xs">
        <div className="w-20 h-20 mx-auto rounded-2xl nyx-surface-2 flex items-center justify-center border border-purple-500/20">
          <BookOpen className="w-10 h-10 text-purple-400" />
        </div>
        <div>
          <p className="nyx-text-primary font-medium text-lg">開始你的創作</p>
          <p className="text-sm nyx-text-muted mt-2">輸入劇情起點、選擇題材或角色，然後點擊「開始創作」</p>
        </div>
        <div className="flex gap-2 justify-center text-xs nyx-text-muted">
          <span className="px-2 py-1 nyx-surface-2 rounded">💡 提示支援</span>
          <span className="px-2 py-1 nyx-surface-2 rounded">🎭 角色設定</span>
        </div>
      </div>
    </div>
  )
}

export function StoryOutput() {
  const { storyOutput, error, isGenerating, currentSceneIndex, totalScenes, isStreaming, storyInput, characters } = useAppStore()
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
  
  // 獲取當前生成狀態
  const { targetSegments } = useAppStore()
  const displaySegments = targetSegments || 2

  return (
    <Card className="nyx-surface nyx-border h-full flex flex-col">
      <CardHeader className="pb-2 border-b nyx-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="nyx-text-primary text-base">故事輸出</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {storyOutput && !isStreaming && (
              <ExportButtons content={storyOutput} title={undefined} />
            )}
            {storyOutput && !isStreaming && (
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
              {charCount} 字
            </span>
          </div>
        </div>
        
        {/* 生成進度條 */}
        <GenerationProgress
          isGenerating={isStreaming}
          currentSegment={currentSceneIndex}
          totalSegments={displaySegments}
          contentLength={storyOutput.length}
          targetTotalLength={displaySegments * 2500}
        />
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
          <EmptyState 
            hasInput={storyInput.trim().length > 0 || characters.length > 0}
            isGenerating={isGenerating}
          />
        )}

        {error && (
          <ErrorDisplay 
            error={error} 
            onDismiss={() => useAppStore.getState().setError(null)}
          />
        )}
      </CardContent>
    </Card>
  )
}

export function GenerateButtons() {
  const { data: session } = useSession()
  const {
    storyInput,
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
    targetSegments,
    setTargetSegments,
    humanizeEnabled,
  } = useAppStore()

  const [rechargeOpen, setRechargeOpen] = useState(false)
  const [wordInfo, setWordInfo] = useState<{ wordCount: number; isFirstPurchase: boolean } | null>(null)
  const [currentSegment, setCurrentSegment] = useState<number>(0)   // V2.5: 當前分段

  const canGenerate = storyInput.trim().length > 0 || characters.length > 0
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

  // V4: 簡化為單段生成
  const buildPrompt = (isContinue: boolean = false) => {
    // V4: 統一使用官方 System Prompt
    const { storyTheme, perspective } = useAppStore.getState()
    const theme = getThemeById(storyTheme)
    const themeAddon = theme ? theme.systemPromptAddon : ''
    const systemPrompt = OFFICIAL_SYSTEM_PROMPT + (themeAddon ? `\n\n【風格要求】${themeAddon}` : '')
    
    // V4.4: 人稱視角設定
    const perspectiveInstruction = perspective === 'first-person' 
      ? '\n【敘述視角】使用第一人稱（我/我們），以主角視角敘述，增強代入感。'
      : '\n【敘述視角】使用第三人稱（他/她/他們），全知視角敘述，更全面展現故事。'

    // V4: 固定約 2000 字單段生成
    const TARGET_WORDS = 2000
    
    let userPrompt = ""
    if (isContinue && storyOutput) {
      // V3.1：優化續寫prompt - 從開頭提取風格樣本避免繼承混亂
      const ending = storyOutput.slice(-600)  // V4: 縮短到 600 字
      // V4: 從文章開頭取風格樣本（保持原始風格）
      const styleSample = storyOutput.slice(0, 500)
      
      // 提取出現過的角色（從全文統計）
      const characterList = characters.length > 0 
        ? characters.map(c => `${c.name}：${c.description}`).join('\n')
        : '（沿用前文角色）'
      
      userPrompt = `【續寫任務 - 新章節】

【目標】約 ${TARGET_WORDS} 字，根據劇情自然完結。

【角色設定】（必須沿用）
${characterList}

【原創風格基準】（模仿開頭風格）
${styleSample.slice(0, 300)}

【承接點】（從此繼續）
...${ending.slice(-200)}

【要求】
1. 自然延續劇情，與前文無縫銜接
2. 禁止重複前文任何句子
3. 風格與【原創風格基準】一致
4. 根據劇情需要自然完結

只輸出故事正文。`
    } else {
      const topicStr = ""
      const charStr = characters.map(c => `${c.name}：${c.description}（${c.traits.join("、")}）`).join("\n")
      
      // V4: 單段生成，自然完結
      userPrompt = `【故事創作】

【目標】生成一個完整故事章節，約 ${TARGET_WORDS} 字，根據劇情自然完結。

【用戶輸入】
- 故事起點：${storyInput || "（由 AI 自由發揮精彩開場）"}
- 題材偏好：${topicStr || "（根據起點自動選擇）"}
- 角色設定：${charStr || "（由 AI 創作）"}
${perspectiveInstruction}

【要求】
1. 根據劇情自然展開、發展、完結
2. 字數約 ${TARGET_WORDS}，可依劇情調整（1800-2500 字）
3. 禁止機械重複
4. 文筆流暢自然

直接輸出故事正文，禁止前言或說明。`
    }

    return { systemPrompt, userPrompt }
  }

  // V3: 生成隱形大綱
  interface StoryOutline {
    scenes: { title: string; summary: string; targetLength: number }[]
  }
  
  const generateOutline = async (): Promise<StoryOutline | null> => {
    try {
      const response = await fetch("/api/story/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story_start: storyInput,
          characters,
          genre: ["模板"].join('、'),
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
  interface OutlineScene {
    title: string
    summary: string
    targetLength: number
  }
  
  const generateSegment = async (
    sceneIndex: number,
    totalScenes: number,
    outlineScene: OutlineScene,
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
          genre: ["模板"].join('、'),
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

  // V5: Prompt Engine 新流程 - 先獲取角色和大綱，再生成故事
  const generateCharacterAndOutline = async (): Promise<{ 
    characters: Array<{ name: string; description: string; traits: string[] }>
    outline: { beginning: string; development: string; climax: string }
    templateId: string | null
  } | null> => {
    const { selectedTemplate } = useAppStore.getState()
    
    // 如果沒有選擇模板，使用默認流程
    if (!selectedTemplate) {
      return null
    }
    
    try {
      const response = await fetch("/api/story/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate
        })
      })
      
      if (!response.ok) {
        console.warn("[V5] Outline generation failed:", await response.text())
        return null
      }
      
      const data = await response.json()
      if (!data.success || !data.data) {
        return null
      }
      
      // 轉換角色格式
      const char1 = {
        name: data.data.characters.character1.name,
        description: data.data.characters.character1.personality,
        traits: data.data.characters.character1.traits
      }
      const char2 = {
        name: data.data.characters.character2.name,
        description: data.data.characters.character2.personality,
        traits: data.data.characters.character2.traits
      }
      
      return {
        characters: [char1, char2],
        outline: data.data.outline,
        templateId: selectedTemplate
      }
    } catch (err) {
      console.error("[V5] Character/Outline generation failed:", err)
      return null
    }
  }

  // V2.5: 直接多段生成（跳過大綱）
  const generateStoryDirect = async () => {
    console.log('[V2.5] generateStoryDirect started, canGenerate:', canGenerate, 'targetSegments:', targetSegments)
    if (!canGenerate) return
    
    // V5: Prompt Engine - 先獲取角色和大綱
    const characterAndOutline = await generateCharacterAndOutline()
    if (characterAndOutline) {
      console.log('[V5] Using new Prompt Engine with:', characterAndOutline.templateId)
    }

    const { resetStreaming, setStreamingState, humanizeEnabled } = useAppStore.getState()
    resetStreaming()
    // V2.9: 設置流式狀態，啟動進度條。currentSceneIndex 從 1 開始（第一段）
    setStreamingState({ isStreaming: true, currentSceneIndex: 1, totalScenes: targetSegments })
    setIsGenerating(true)
    setError(null)
    setStoryOutput("")

    // V2.9: humanize 緩衝區
    let humanizeBuffer = ""

    try {
      const { systemPrompt, userPrompt } = buildPrompt(false)
      const anonymousId = !isLoggedIn ? getOrCreateAnonymousId() : undefined

      // V4: 固定單段生成，無需多段 header
      const headers: Record<string, string> = { "Content-Type": "application/json" }

      // humanize 標記
      if (humanizeEnabled) {
        headers['x-humanize'] = 'true'
      }

      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers,
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          model: "deepseek/deepseek-r1-0528",
          
          characters,
          ...(anonymousId && { anonymousId }),
          skipCache: true,  // V4: 永遠跳過緩存，確保每次生成新內容
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
                // 更新 store 中的流式狀態
                const { setStreamingState } = useAppStore.getState()
                setStreamingState({ currentSceneIndex: parsed.segmentIndex })
                console.log('[V2.5] Segment', parsed.segmentIndex, 'started')
                continue
              }
              if (parsed.segmentDone) {
                console.log('[V2.5] Segment', parsed.segmentIndex, 'done, total:', parsed.totalWords)
                continue
              }

              if (parsed.error) {
                // V4.1: 字數不足錯誤處理 - 清空已輸出的不完整內容
                if (parsed.errorType === "free_quota_exceeded") {
                  setStoryOutput("")  // 清空不完整內容
                  setShowSignupPrompt(true)
                  return
                }
                if (parsed.errorType === "insufficient_words") {
                  setStoryOutput("")  // 清空不完整內容
                  const info = await getUserWordCount()
                  setWordInfo(info)
                  setShowRechargePrompt(true)
                  return
                }
                setError(parsed.error)
                return
              }

              if (parsed.content) {
                // V2.9: 如果啟用 humanize，處理內容
                if (humanizeEnabled) {
                  const { humanizeChunk } = await import('@/lib/humanizer')
                  const { output, newBuffer } = humanizeChunk(parsed.content, humanizeBuffer)
                  humanizeBuffer = newBuffer
                  if (output) {
                    appendStoryOutput(output)
                  }
                } else {
                  appendStoryOutput(parsed.content)
                }
              }

              if (parsed.done) {
                // V2.9: 處理剩餘的 humanize 緩衝
                if (humanizeEnabled && humanizeBuffer) {
                  const { humanizeText } = await import('@/lib/humanizer')
                  const finalChunk = humanizeText(humanizeBuffer)
                  if (finalChunk) {
                    appendStoryOutput(finalChunk)
                  }
                  humanizeBuffer = ""
                }
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
      // 結束流式狀態
      const { setStreamingState } = useAppStore.getState()
      setStreamingState({ isStreaming: false })
    }
  }

  // V3: 舊的故事生成流程（已棄用，改用 generateStoryDirect）
  const generateStoryV3 = async (skipCache: boolean = false) => {
    // 直接調用 V2.5 版本
    await generateStoryDirect()
  }

  // V4: 強制跳過緩存的生成（用於「再寫一次」功能）
  const regenerateStory = async () => {
    await generateStoryDirect()
  }

  // V1/V2: 續寫流程（保持原有邏輯）
  const continueStory = async () => {
    const { setStreamingState, humanizeEnabled } = useAppStore.getState()
    // 設置流式狀態，啟動進度條（續寫顯示為第 1/1 段）
    setStreamingState({ isStreaming: true, currentSceneIndex: 1, totalScenes: 1 })
    setIsGenerating(true)
    setError(null)

    // V2.9: humanize 緩衝區
    let humanizeBuffer = ""

    try {
      const { systemPrompt, userPrompt } = buildPrompt(true)
      const anonymousId = !isLoggedIn ? getOrCreateAnonymousId() : undefined

      // V2.5: 續寫不使用多段模式（只用單段生成）
      const headers: Record<string, string> = { "Content-Type": "application/json" }

      // V2.9: 添加 humanize 標記
      if (humanizeEnabled) {
        headers['x-humanize'] = 'true'
      }

      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers,
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          model: "deepseek/deepseek-r1-0528",
          
          characters,
          ...(anonymousId && { anonymousId }),
          skipCache: true,  // 續寫永遠生成新內容，不讀緩存
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
                // V4.1: 字數不足錯誤處理 - 續寫不清空內容（保留前文），但顯示提示
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
                // V2.9: 如果啟用 humanize，處理內容
                if (humanizeEnabled) {
                  const { humanizeChunk } = await import('@/lib/humanizer')
                  const { output, newBuffer } = humanizeChunk(parsed.content, humanizeBuffer)
                  humanizeBuffer = newBuffer
                  if (output) {
                    appendStoryOutput(output)
                  }
                } else {
                  appendStoryOutput(parsed.content)
                }
              }

              if (parsed.done) {
                // V2.9: 處理剩餘的 humanize 緩衝
                if (humanizeEnabled && humanizeBuffer) {
                  const { humanizeText } = await import('@/lib/humanizer')
                  const finalChunk = humanizeText(humanizeBuffer)
                  if (finalChunk) {
                    appendStoryOutput(finalChunk)
                  }
                  humanizeBuffer = ""
                }
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
      // 結束流式狀態
      const { setStreamingState } = useAppStore.getState()
      setStreamingState({ isStreaming: false })
    }
  }

  return (
    <>
      <div className="space-y-2">
        {/* V4: 分段選擇器已移除，固定單段生成 */}

        {!hasOutput ? (
          // 未有故事：顯示「開始創作」
          <Button
            onClick={() => generateStoryV3(false)}
            disabled={!canGenerate || isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />生成中...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-1 sm:mr-2" />開始創作</>
            )}
          </Button>
        ) : (
          // 已有故事：「繼續創作」+ 「再寫一次」並排
          <div className="flex gap-1 sm:gap-2">
            <Button
              onClick={() => continueStory()}
              disabled={isGenerating}
              className="flex-1 bg-purple-600 hover:bg-purple-700 px-2 sm:px-4"
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />續寫中...</>
              ) : (
                <><RotateCcw className="w-4 h-4 mr-1 sm:mr-2" />繼續創作</>
              )}
            </Button>
            <Button
              onClick={() => {
                // 標記需要重新生成
                useAppStore.getState().setShouldRegenerate(true)
              }}
              disabled={isGenerating}
              variant="outline"
              className="flex-1 nyx-border nyx-text-secondary hover:text-orange-400 px-2 sm:px-4"
            >
              <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />再寫一次
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
