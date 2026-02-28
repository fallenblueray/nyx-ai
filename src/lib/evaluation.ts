/**
 * NyxAI 故事質量評估系統
 * 
 * 使用 LLM 自動評估生成故事的多維度質量指標
 * 評估結果用於：
 * - 用戶反饋（了解生成質量）
 * - AI 自我學習（改進未來生成）
 * - 質量過濾（阻擋低質量內容）
 */

import { createAdminClient } from '@/lib/supabase-admin'

// ============================================================
// 質量維度定義
// ============================================================

export interface StoryEvaluationMetrics {
  // 1. 情節連貫性 (Coherence)
  // 故事是否合理、邏輯通順
  coherence: number // 0-10
  
  // 2. 角色一致性 (Character Consistency)
  // 角色行為是否符合設定、性格是否連貫
  characterConsistency: number // 0-10
  
  // 3. 文學質量 (Literary Quality)
  // 描寫技巧、語言表達、氛圍營造
  literaryQuality: number // 0-10
  
  // 4. 情節吸引力 (Engagement)
  // 開頭是否有張力、高潮是否充分
  engagement: number // 0-10
  
  // 5. 主題符合度 (Theme Alignment)
  // 情節是否與用戶要求的題材/風格一致
  themeAlignment: number // 0-10
  
  // 6. 創意獨特性 (Creativity)
  // 是否有新穎的設定或不俗套的發展
  creativity: number // 0-10
  
  // 總分
  overallScore: number // 0-100 (加權平均)
  
  // AI 評僀摘要
  summary: string
  
  // 改進建議
  suggestions: string[]
  
  // 是否通過質量門檻（可配置）
  passedThreshold: boolean
}

// 質量門檻（默認：總分 >= 6.0）
const QUALITY_THRESHOLD = 6.0

// ============================================================
// 評估系統提示模板
// ============================================================

const EVALUATION_SYSTEM_PROMPT = `你是 NyxAI 的故事質量評估專家。請客觀評估以下故事，從多個維度打分（0-10分），並提供改進建議。

評估維度：

1. **情節連貫性** (Coherence)
   - 故事情節是否邏輯合理
   - 場景轉換是否自然
   - 是否有因果斷裂或突兀跳轉

2. **角色一致性** (Character Consistency)
   - 角色性格是否前後一致
   - 行為動機是否合理
   - 角色設定是否有其獨特性

3. **文學質量** (Literary Quality)
   - 描審是否生動細節
   - 語言節奏是否流暢
   - 是否有重複或囉嗦表述

4. **情節吸引力** (Engagement)
   - 開場是否有代入感
   - 高潮是否充分、釋放是否完整
   - 能否激起讀者想像

5. **主題符合度** (Theme Alignment)
   - 是否符合要求的風格（含蓄/直接）
   - 是否達到用戶指定的張力要求

6. **創意獨特性** (Creativity)
   - 設定是否新穎
   - 是否有不落俗套的情節設計
   - 場景或互動是否獨特

要求：
- 打分必須客觀，嚴格按標準評判
- 總分 = 各維度平均 × 10
- 總分低於 6.0 為「未通過」
- 必須提供具體的改進建議

輸出格式（嚴格 JSON）：
{
  "coherence": 數字,
  "characterConsistency": 數字,
  "literaryQuality": 數字,
  "engagement": 數字,
  "themeAlignment": 數字,
  "creativity": 數字,
  "overallScore": 數字,
  "summary": "評僀摘要，100字以內",
  "suggestions": ["建議1", "建議2", "建議3"],
  "passedThreshold": true/false
}`

// ============================================================
// 質量評估函數
// ============================================================

interface EvaluationInput {
  content: string
  storyInput?: string
  topics?: Array<{ category: string; item: string }>
  characters?: Array<{ name: string; description: string; traits: string[] }>
}

/**
 * 使用 LLM 評估故事質量
 * 注：評估異步執行，不阻塞生成流程
 */
export async function evaluateStory(
  storyId: string,
  input: EvaluationInput
): Promise<StoryEvaluationMetrics | null> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    console.warn('[evaluation] Missing OPENROUTER_API_KEY')
    return null
  }

  try {
    // 構建評估 prompt
    const userPrompt = buildEvaluationPrompt(input)

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://nyx-ai-woad.vercel.app',
        'X-Title': 'NyxAI Evaluation'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-0528', // 使用較便宜的模型評估
        messages: [
          { role: 'system', content: EVALUATION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.3 // 降低創意，提高一致性
      })
    })

    if (!response.ok) {
      console.error('[evaluation] API error:', response.status)
      return null
    }

    const data = await response.json()
    const evaluationText = data.choices?.[0]?.message?.content

    if (!evaluationText) {
      console.warn('[evaluation] Empty response')
      return null
    }

    // 解析 JSON 響應
    const metrics = parseEvaluationResponse(evaluationText)
    
    // 存儲評估結果
    if (metrics) {
      await saveEvaluation(storyId, metrics)
    }

    return metrics
  } catch (error) {
    console.error('[evaluation] Error:', error)
    return null
  }
}

function buildEvaluationPrompt(input: EvaluationInput): string {
  const parts: string[] = []
  
  if (input.storyInput) {
    parts.push(`【用戶輸入故事起點】\n${input.storyInput}\n`)
  }
  
  if (input.topics && input.topics.length > 0) {
    parts.push(`【要求題材】\n${input.topics.map(t => t.item).join('、')}\n`)
  }
  
  if (input.characters && input.characters.length > 0) {
    parts.push(`【角色設定】\n${input.characters.map(c => `${c.name}：${c.description}`).join('\n')}\n`)
  }
  
  parts.push(`【生成內容】\n${input.content}`)
  
  return parts.join('\n')
}

function parseEvaluationResponse(text: string): StoryEvaluationMetrics | null {
  try {
    // 嘗試提取 JSON（可能被包裹在 markdown code block 中）
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) 
      || text.match(/```\s*([\s\S]*?)\s*```/)
      || [null, text]
    
    const jsonText = jsonMatch[1] || text
    const parsed = JSON.parse(jsonText.trim())
    
    // 驗證必要欄位
    const required = ['coherence', 'characterConsistency', 'literaryQuality', 
                      'engagement', 'themeAlignment', 'creativity']
    
    for (const field of required) {
      if (!(field in parsed) || typeof parsed[field] !== 'number') {
        console.warn(`[evaluation] Missing or invalid field: ${field}`)
        return null
      }
    }
    
    // 計算總分
    const overallScore = (parsed.coherence + parsed.characterConsistency + 
                         parsed.literaryQuality + parsed.engagement + 
                         parsed.themeAlignment + parsed.creativity) / 6 * 10
    
    return {
      coherence: Math.min(10, Math.max(0, parsed.coherence)),
      characterConsistency: Math.min(10, Math.max(0, parsed.characterConsistency)),
      literaryQuality: Math.min(10, Math.max(0, parsed.literaryQuality)),
      engagement: Math.min(10, Math.max(0, parsed.engagement)),
      themeAlignment: Math.min(10, Math.max(0, parsed.themeAlignment)),
      creativity: Math.min(10, Math.max(0, parsed.creativity)),
      overallScore: overallScore,
      summary: parsed.summary || '無摘要',
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      passedThreshold: overallScore >= QUALITY_THRESHOLD
    }
  } catch (error) {
    console.error('[evaluation] Parse error:', error)
    return null
  }
}

// ============================================================
// 評估結果存儲
// ============================================================

async function saveEvaluation(
  storyId: string,
  metrics: StoryEvaluationMetrics
): Promise<void> {
  const supabase = createAdminClient()
  
  const { error } = await supabase
    .from('story_evaluations')
    .upsert({
      story_id: storyId,
      coherence: metrics.coherence,
      character_consistency: metrics.characterConsistency,
      literary_quality: metrics.literaryQuality,
      engagement: metrics.engagement,
      theme_alignment: metrics.themeAlignment,
      creativity: metrics.creativity,
      overall_score: metrics.overallScore,
      summary: metrics.summary,
      suggestions: metrics.suggestions,
      passed_threshold: metrics.passedThreshold,
      evaluated_at: new Date().toISOString()
    }, {
      onConflict: 'story_id'
    })
  
  if (error) {
    console.error('[evaluation] Save error:', error)
  }
}

/**
 * 獲取故事評估結果
 */
export async function getStoryEvaluation(
  storyId: string
): Promise<StoryEvaluationMetrics | null> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('story_evaluations')
    .select('*')
    .eq('story_id', storyId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return {
    coherence: data.coherence,
    characterConsistency: data.character_consistency,
    literaryQuality: data.literary_quality,
    engagement: data.engagement,
    themeAlignment: data.theme_alignment,
    creativity: data.creativity,
    overallScore: data.overall_score,
    summary: data.summary,
    suggestions: data.suggestions || [],
    passedThreshold: data.passed_threshold
  }
}