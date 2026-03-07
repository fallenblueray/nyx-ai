import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from 'next/server'
import { clearPromptCache } from '@/lib/prompt-engine'

// GET - 讀取所有提示詞配置
export async function GET() {
  try {
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('admin_prompts')
      .select('*')
      .eq('is_active', true)
      .order('key')

    if (error) {
      console.error('[Admin Prompts API] Error fetching prompts:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch prompts' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[Admin Prompts API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - 更新提示詞配置（需要管理員密碼）
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { key, content, password } = body

    // 從環境變數獲取管理員密碼（默認為 nyx-admin-2024）
    const adminPassword = process.env.ADMIN_PASSWORD || 'nyx-admin-2024'
    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    if (!key || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing key or content' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // 先獲取當前版本號
    const { data: currentData } = await supabase
      .from('admin_prompts')
      .select('version')
      .eq('key', key)
      .single()

    const newVersion = (currentData?.version || 0) + 1

    // 更新提示詞，同時增加版本號
    const { data, error } = await supabase
      .from('admin_prompts')
      .update({
        content,
        version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('key', key)
      .select()

    if (error) {
      console.error('[Admin Prompts API] Error updating prompt:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update prompt' },
        { status: 500 }
      )
    }

    // V5.3: 清除提示詞緩存，使新配置立即生效
    clearPromptCache()
    console.log(`[Admin Prompts API] Prompt updated: ${key}, cache cleared`)

    return NextResponse.json({ success: true, data: data?.[0] })
  } catch (error) {
    console.error('[Admin Prompts API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}