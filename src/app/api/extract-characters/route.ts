import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/security"
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// 角色提取系統提示 - 設計為快速、精確
const CHARACTER_EXTRACTION_PROMPT = `你是角色分析專家。任務：從提供的故事文本中提取所有出現的角色，返回 JSON 格式。

輸出規則：
1. 只返回 JSON，無其他文字
2. 每個角色包含：name(名字), description(一句外觀/性格描述), traits(2-3個特徵標籤)
3. 最多返回5個主要角色
4. 若角色有名字，優先使用名字；若無名則用身份稱謂
5. 若無角色或無法識別，返回空數組 []

輸出格式：
{
  "characters": [
    { "name": "角色名", "description": "描述", "traits": ["標籤1", "標籤2"] },
    ...
  ]
}`
/**
 * POST /api/extract-characters
 * 後台異步提取角色 - 快速廉價模型（DeepSeek V3.2）
 */
export async function POST(req: NextRequest) {
  try {
    // 速率限制（更寬鬆，因為是後台任務）
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateCheck = checkRateLimit(`extract-characters:${clientIp}`, 'anonymous')
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: '請求過於頻繁' }, { status: 429 })
    }
    const { storyText } = await req.json()
    if (!storyText || typeof storyText !== 'string') {
      return NextResponse.json({ error: '缺少故事文本' }, { status: 400 })
    }
    if (storyText.length < 50) {
      // 故事太短，跳過提取
      return NextResponse.json({ characters: [] })
    }
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      console.error('[extract-characters] Missing OPENROUTER_API_KEY')
      return NextResponse.json({ error: '服務暫不可用' }, { status: 500 })
    }
    // 調用 DeepSeek V3.2 進行角色提取
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://nyx-ai-woad.vercel.app',
        'X-Title': 'NyxAI'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v3.2',
        messages: [
          { role: 'system', content: CHARACTER_EXTRACTION_PROMPT },
          { role: 'user', content: `請從以下故事中提取角色：\n\n${storyText.slice(0, 2000)}\n\n只返回 JSON 格式：` }
        ],
        max_tokens: 500,
        temperature: 0.3 // 低溫度確保穩定輸出
      })
    })
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[extract-characters] API error:', response.status, errorData)
      return NextResponse.json({ error: '提取失敗' }, { status: 500 })
    }
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    // 解析 JSON 回應
    interface ExtractedCharacter {
      name: string
      description?: string
      traits?: string[]
    }
    let characters: ExtractedCharacter[] = []
    try {
      // 嘗試直接解析
      const parsed = JSON.parse(content)
      characters = parsed.characters || []
    } catch {
      // 嘗試從文本中提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          characters = parsed.characters || []
        } catch {
          characters = []
        }
      }
    }
    // 驗證每個角色格式
    const validCharacters = characters
      .filter((c: ExtractedCharacter) => c.name && typeof c.name === 'string')
      .map((c: ExtractedCharacter) => ({
        name: c.name.slice(0, 20),
        description: (c.description || '無描述').slice(0, 100),
        traits: Array.isArray(c.traits) 
          ? c.traits.slice(0, 3).map((t: string) => t.slice(0, 10)).filter(Boolean)
          : []
      }))
      .slice(0, 5)
    return NextResponse.json({ characters: validCharacters })
  } catch (error) {
    console.error('[extract-characters] Error:', error)
    // 後台任務失敗不影響用戶體驗 - 返回空角色
    return NextResponse.json({ characters: [] })
  }
}