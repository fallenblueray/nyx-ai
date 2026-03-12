import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { createAdminClient } from "@/lib/supabase-admin"
import { nanoid } from "nanoid"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SaveStoryRequest {
  content: string
  title?: string
  templateId?: string
  templateName?: string
  isPublic?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body: SaveStoryRequest = await req.json()
    
    const { content, title, templateId, templateName, isPublic = true } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "故事內容不能為空" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 生成短 ID（8 位，易讀）
    const shortId = nanoid(8)

    // 提取標題（如果沒有提供）
    const storyTitle = title || content.split("\n")[0].slice(0, 50) || "未命名故事"

    // 保存故事
    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        user_id: session?.user?.id || null,
        title: storyTitle,
        content: content,
        short_id: shortId,
        template_id: templateId || null,
        template_name: templateName || null,
        is_public: isPublic,
        word_count: content.length,
      })
      .select("id, short_id")
      .single()

    if (error) {
      console.error("Save story error:", error)
      return NextResponse.json({ error: "保存失敗" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      storyId: story.id,
      shortId: story.short_id,
      shareUrl: `https://nyx-ai.net/s/${story.short_id}`,
    })
  } catch (error) {
    console.error("Save story API error:", error)
    return NextResponse.json({ error: "服務器錯誤" }, { status: 500 })
  }
}
