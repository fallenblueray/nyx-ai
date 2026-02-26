'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { createServerClient } from '@/lib/supabase/server-async'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { revalidatePath } from 'next/cache'

// 讀取用戶預設題材
export async function getUserDefaultTopics(): Promise<string[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return []

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('users')
    .select('default_topics')
    .eq('id', session.user.id)
    .single()

  return (data?.default_topics as string[]) ?? []
}

// 儲存用戶預設題材
export async function saveUserDefaultTopics(topics: string[]): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { error: '未登入' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('users')
    .upsert({
      id: session.user.id,
      default_topics: topics,
    })

  if (error) {
    console.error('Save default topics error:', error)
    return { error: error.message }
  }

  return {}
}

// 更新用戶偏好設定（語言、主題等）
export async function updateUserPreference(
  key: 'preferred_language' | 'theme',
  value: string
) {
  try {
    const supabase = await createServerClient()
    
    // 獲取當前用戶
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error('用戶未登入')
    }

    // 更新 public.profiles 表
    const { error } = await supabase
      .from('profiles')
      .update({ [key]: value })
      .eq('user_id', user.id)

    if (error) {
      throw new Error(`更新失敗: ${error.message}`)
    }

    // 重新驗證設定頁
    revalidatePath('/settings')
    return { success: true }
  } catch (error) {
    console.error('updateUserPreference error:', error)
    throw error
  }
}
