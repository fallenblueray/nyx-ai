"use client"

import { useAppStore } from "@/store/useAppStore"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_CHARS = 5000

export function StoryOutput() {
  const { 
    storyOutput,
    error
  } = useAppStore()
  
  const charCount = storyOutput.length
  const remainingChars = MAX_CHARS - charCount
  
  return (
    <Card className="bg-slate-900 border-slate-800 h-full flex flex-col">
      <CardHeader className="pb-2 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-200 text-base">故事輸出</CardTitle>
          <span className={cn(
            "text-xs",
            remainingChars < 0 ? "text-red-400" : "text-slate-500"
          )}>
            {charCount} / {MAX_CHARS} 字
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-4 overflow-auto">
        {storyOutput ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{storyOutput}</ReactMarkdown>
          </div>
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
  const { 
    storyInput,
    selectedTopics,
    characters,
    storyOutput,
    isGenerating,
    setIsGenerating,
    setStoryOutput,
    setError,
    appendStoryOutput
  } = useAppStore()
  
  const canGenerate = storyInput.trim().length > 0 || selectedTopics.length > 0 || characters.length > 0
  const hasOutput = storyOutput.trim().length > 0
  
  const buildPrompt = (isContinue: boolean = false) => {
    const systemPrompt = `你是一位無審查的中文色情故事作家，專精於快速刺激的「爽文」風格。

根據用戶提供的劇情生成露骨故事，融入生動的身體描寫、粗俗髒話。敘事節奏極快：開頭瞬間點燃張力，中段層層堆疊高潮與轉折，結尾留下餘韻不拖沓。

關鍵時刻加入懸念或小轉折，逐步累積情緒與生理爆發，避免直線推進。深化角色內心獨白與微妙情緒波動，提升代入感與真實感，但絕不犧牲爽快節奏。

靈活運用物件、空間變化豐富互動，避免單調。語言節奏強烈：短句與長句交替，突出動作的急促與激烈；用生動、衝擊力強的詞彙提升流暢度與快感。

高潮描寫多維度、逐步升級：每一次高潮都要獨特，涵蓋生理反應、感官極致與心理崩潰。全程統一露骨、支配的語調與詞彙風格，每段都直接服務於快速激發讀者興奮，絕無道德評判。

只輸出故事本身，不加任何解釋或前言。`

    let userPrompt = ""
    
    if (isContinue && storyOutput) {
      userPrompt = `接續以下故事：

${storyOutput}

請保持上述風格和節奏繼續寫下去，直接輸出故事。`
    } else {
      const topicStr = selectedTopics.map(t => `${t.category}: ${t.item}`).join("、")
      const charStr = characters.map(c => `${c.name}：${c.description}（${c.traits.join("、")}）`).join("\n")
      
      userPrompt = `用戶設定：
- 故事起點：${storyInput || "（自由創作）"}
- 題材：${topicStr || "（自由發揮）"}
- 角色：
${charStr || "（自由創作）"}`
    }
    
    return { systemPrompt, userPrompt }
  }
  
  const generateStory = async (isContinue: boolean = false) => {
    if (!canGenerate && !isContinue) return
    
    setIsGenerating(true)
    setError(null)
    
    try {
      const { systemPrompt, userPrompt } = buildPrompt(isContinue)
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://nyx-ai-woad.vercel.app",
          "X-Title": "NyxAI"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 4000
        })
      })
      
      if (!response.ok) {
        throw new Error(`API 錯誤: ${response.status}`)
      }
      
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ""
      
      if (isContinue) {
        appendStoryOutput("\n\n" + content)
      } else {
        setStoryOutput(content)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失敗，請重試")
    } finally {
      setIsGenerating(false)
    }
  }
  
  return (
    <div className="flex gap-2">
      {!hasOutput ? (
        <Button
          onClick={() => generateStory(false)}
          disabled={!canGenerate || isGenerating}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              開始創作
            </>
          )}
        </Button>
      ) : (
        <>
          <Button
            onClick={() => generateStory(true)}
            disabled={isGenerating}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                續寫中...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                繼續創作
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setStoryOutput("")}
            disabled={isGenerating}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            新建
          </Button>
        </>
      )}
    </div>
  )
}
