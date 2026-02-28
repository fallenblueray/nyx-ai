/**
 * 匿名用戶字數查詢 API
 * GET /api/anonymous-usage?id=<anonymousId>
 * 
 * 服務端驗證，防止前端偽造字數
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const FREE_WORD_LIMIT = 8000

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const anonymousId = searchParams.get('id')

  if (!anonymousId || !/^[0-9a-f-]{36}$/i.test(anonymousId)) {
    return NextResponse.json({ error: '無效的匿名 ID' }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('anonymous_usage')
      .select('words_used, words_limit')
      .eq('anonymous_id', anonymousId)
      .maybeSingle()

    if (error) {
      console.error('[anonymous-usage GET] Error:', error)
      return NextResponse.json({ error: '查詢失敗' }, { status: 500 })
    }

    if (!data) {
      // 首次訪問，返回滿額度
      return NextResponse.json({
        wordsUsed: 0,
        wordsLimit: FREE_WORD_LIMIT,
        wordsLeft: FREE_WORD_LIMIT,
        isNew: true
      })
    }

    return NextResponse.json({
      wordsUsed: data.words_used,
      wordsLimit: data.words_limit,
      wordsLeft: Math.max(0, data.words_limit - data.words_used),
      isNew: false
    })
  } catch (err) {
    console.error('[anonymous-usage GET] Unexpected error:', err)
    return NextResponse.json({ error: '系統錯誤' }, { status: 500 })
  }
}
