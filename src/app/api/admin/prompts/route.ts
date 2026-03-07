import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from 'next/server'
import { clearPromptCache } from '@/lib/prompt-engine'

// GET - 讀取所有提示詞配置
export async function GET() {
  try {
    console.log('[Admin Prompts API] GET /api/admin/prompts')
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

    console.log(`[Admin Prompts API] Fetched ${data?.length || 0} prompts:`, 
      data?.map((p: {key: string, version: number, id: string}) => `${p.key}(v${p.version}, id=${p.id.slice(0,8)})`).join(', '))
    
    // 檢查是否有重複 key
    const keyCounts: Record<string, number> = {}
    data?.forEach((p: {key: string}) => {
      keyCounts[p.key] = (keyCounts[p.key] || 0) + 1
    })
    const duplicates = Object.entries(keyCounts).filter(([_, count]) => count > 1)
    if (duplicates.length > 0) {
      console.warn('[Admin Prompts API] Duplicate keys found:', duplicates)
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

    // 先檢查記錄是否存在
    const { data: existingData, error: checkError } = await supabase
      .from('admin_prompts')
      .select('*')
      .eq('key', key)
      .maybeSingle()

    if (checkError) {
      console.error('[Admin Prompts API] Error checking prompt:', checkError)
      return NextResponse.json(
        { success: false, error: 'Database error: ' + checkError.message },
        { status: 500 }
      )
    }

    let result

    if (existingData) {
      // 更新現有記錄
      const newVersion = (existingData.version || 0) + 1
      console.log(`[Admin Prompts API] Updating existing prompt: ${key}, version: ${newVersion}`)

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
          { success: false, error: 'Failed to update: ' + error.message },
          { status: 500 }
        )
      }
      result = data?.[0]
    } else {
      // 插入新記錄
      console.log(`[Admin Prompts API] Creating new prompt: ${key}`)

      const { data, error } = await supabase
        .from('admin_prompts')
        .insert({
          key,
          name: key === 'character' ? '角色生成提示詞' : key === 'outline' ? '大綱生成提示詞' : '故事生成提示詞',
          description: '動態創建的提示詞',
          content,
          version: 1,
          is_active: true
        })
        .select()

      if (error) {
        console.error('[Admin Prompts API] Error inserting prompt:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to insert: ' + error.message },
          { status: 500 }
        )
      }
      result = data?.[0]
    }

    // V5.3: 清除提示詞緩存，使新配置立即生效
    clearPromptCache()
    console.log(`[Admin Prompts API] Prompt saved: ${key}, cache cleared`)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('[Admin Prompts API] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}