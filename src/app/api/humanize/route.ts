import { NextRequest, NextResponse } from "next/server"
import { humanizeText, detectAIHints, getHumanizeReport } from "@/lib/humanizer"

export async function POST(req: NextRequest) {
  try {
    const { text, mode = 'humanize' } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: "缺少文本參數" }, { status: 400 })
    }

    switch (mode) {
      case 'detect':
        // 只檢測 AI 分數
        const score = detectAIHints(text)
        return NextResponse.json({ 
          aiScore: score,
          shouldHumanize: score > 30 
        })

      case 'report':
        // 獲取詳細報告
        const report = getHumanizeReport(text)
        return NextResponse.json(report)

      case 'humanize':
      default:
        // 執行 humanize
        const humanized = humanizeText(text)
        const originalScore = detectAIHints(text)
        const newScore = detectAIHints(humanized)
        
        return NextResponse.json({
          original: text,
          humanized,
          originalScore,
          newScore,
          improvement: originalScore - newScore
        })
    }
  } catch (error) {
    console.error("[humanize] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "處理失敗" },
      { status: 500 }
    )
  }
}