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

    // 簡單密碼驗證（實際應使用環境變數）
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

    // 更新提示詞，同時增加版本號
    const { data, error } = await supabase
      .from('admin_prompts')
      .update({
        content,
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