'use server'

import { createServerClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { revalidatePath } from 'next/cache'

// 查詢用戶剩餘字數
export async function getUserWordCount(): Promise<{ wordCount: number; isFirstPurchase: boolean }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { wordCount: 0, isFirstPurchase: true }

  // ✅ 使用 admin client 繞過 RLS
  const supabase = createAdminClient()
  
  // 清除緩存確保取最新數據
  revalidatePath('/app')
  revalidatePath('/')
  
  console.log('📊 [getUserWordCount] Fetching for user:', session.user.id)
  
  const { data, error } = await supabase
    .from('profiles')
    .select('word_count, is_first_purchase')
    .eq('id', session.user.id)
    .single()

  console.log('📊 [getUserWordCount] Result:', data, 'Error:', error)

  return {
    wordCount: data?.word_count ?? 8000,
    isFirstPurchase: data?.is_first_purchase ?? true,
  }
}

// 扣除字數（生成完成後呼叫）
export async function deductWordCount(wordsUsed: number): Promise<{ success: boolean; remaining: number; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, remaining: 0, error: '請先登入' }

  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('profiles')
    .select('word_count')
    .eq('id', session.user.id)
    .single()

  const current = user?.word_count ?? 8000
  if (current < wordsUsed) {
    return { success: false, remaining: current, error: '字數不足，請充值' }
  }

  const newCount = current - wordsUsed
  await supabase
    .from('profiles')
    .upsert({ id: session.user.id, word_count: newCount })

  return { success: true, remaining: newCount }
}

export interface StoryData {
  id?: string
  title: string
  content: string
  topics?: Array<{ category: string; item: string }>
  roles: Array<{ name: string; description: string; traits: string[] }>
  is_public?: boolean
}

export async function saveStory(data: StoryData) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: '請先登入' }
  }

  try {
    // ✅ 使用 admin client 繞過 RLS
    const supabase = createAdminClient()

    const storyData = {
      user_id: session.user.id,
      title: data.title,
      content: data.content,
      topics: data.topics ? JSON.stringify(data.topics) : null,
      roles: JSON.stringify(data.roles),
      is_public: data.is_public || false,
    }

    const { data: story, error } = await supabase
      .from('stories')
      .insert(storyData)
      .select()
      .single()

    if (error) {
      console.error('Supabase save error:', error)
      if (error.code === '42501') return { error: '權限不足，請重新登入' }
      return { error: error.message }
    }

    revalidatePath('/app')
    return { story }
  } catch (err) {
    console.error('saveStory unexpected error:', err)
    return { error: '儲存失敗，請稍後重試' }
  }
}

export async function updateStory(id: string, data: Partial<StoryData>) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: '請先登入' }
  }

  // ✅ 使用 admin client 繞過 RLS
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {}
  if (data.title) updateData.title = data.title
  if (data.content) updateData.content = data.content
  if (data.topics) updateData.topics = JSON.stringify(data.topics)
  if (data.roles) updateData.roles = JSON.stringify(data.roles)
  if (data.is_public !== undefined) updateData.is_public = data.is_public

  const { data: story, error } = await supabase
    .from('stories')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { story }
}

export async function getUserStories() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: '請先登入' }
  }

  // ✅ 使用 admin client 繞過 RLS
  const supabase = createAdminClient()

  const { data: stories, error } = await supabase
    .from('stories')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, stories: [] }
  }

  return { stories }
}

export async function getSharedStory(shareId: string) {
  try {
    const supabase = createAdminClient()

    // Try by ID first, then by short_id
    const query = supabase
      .from('stories')
      .select('*')
      .eq('is_public', true)

    // Check if shareId looks like UUID (direct id) or short token
    if (shareId.includes('-') && shareId.length === 36) {
      // Try as story id first
      const { data: data1 } = await query.eq('id', shareId).maybeSingle()
      if (data1) return { story: data1 }
    }

    // Try by short_id (8-char nanoid)
    const { data: story, error } = await query.eq('short_id', shareId).maybeSingle()
    if (error || !story) {
      // Fallback: try by id (for backward compatibility)
      const { data: storyById, error: idError } = await supabase
        .from('stories')
        .select('*')
        .eq('is_public', true)
        .eq('id', shareId)
        .maybeSingle()
      if (idError || !storyById) return { error: '找不到故事' }
      return { story: storyById }
    }
    return { story }
  } catch (err) {
    console.error('getSharedStory error:', err)
    return { error: '載入故事失敗' }
  }
}

export async function shareStory(id: string) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return { error: '請先登入' }
  }

  // ✅ 使用 admin client 繞過 RLS
  const supabase = createAdminClient()

  // 獲取故事的 short_id（新版使用 short_id 而不是 share_id）
  const { data: story, error } = await supabase
    .from('stories')
    .update({ is_public: true })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select('short_id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  // 返回 short_id 作為分享 ID
  return { shareId: story?.short_id || id }
}
