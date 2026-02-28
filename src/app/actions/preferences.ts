'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { revalidatePath } from 'next/cache'

export interface UserPreferences {
  preferred_styles: string[]
  preferred_topics: Array<{ category: string; item: string }>
  preferred_word_length: number
  saved_characters: Array<{ name: string; description: string; traits: string[] }>
  writing_style_notes: string
  total_stories_generated: number
  total_words_generated: number
}

/**
 * 獲取用戶偏好（記憶層數據）
 */
export async function getUserPreferences(): Promise<{
  preferences: UserPreferences | null
  error?: string
}> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { preferences: null, error: '請先登入' }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (error) return { preferences: null, error: error.message }

  if (!data) {
    // 尚未有偏好記錄，返回空值
    return {
      preferences: {
        preferred_styles: [],
        preferred_topics: [],
        preferred_word_length: 1000,
        saved_characters: [],
        writing_style_notes: '',
        total_stories_generated: 0,
        total_words_generated: 0,
      }
    }
  }

  return { preferences: data as UserPreferences }
}

/**
 * 更新用戶風格偏好（手動設置）
 */
export async function updatePreferredStyles(styles: string[]): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: '請先登入' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      { user_id: session.user.id, preferred_styles: styles },
      { onConflict: 'user_id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

/**
 * 更新偏好字數長度
 */
export async function updatePreferredWordLength(length: number): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: '請先登入' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      { user_id: session.user.id, preferred_word_length: length },
      { onConflict: 'user_id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

/**
 * 更新寫作風格備注（用戶可手動輸入個性化指令）
 */
export async function updateStyleNotes(notes: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: '請先登入' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      { user_id: session.user.id, writing_style_notes: notes },
      { onConflict: 'user_id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings')
  return { success: true }
}

/**
 * 重置所有偏好（清除記憶）
 */
export async function resetPreferences(): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: '請先登入' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: session.user.id,
        preferred_styles: [],
        preferred_topics: [],
        preferred_word_length: 1000,
        writing_style_notes: '',
      },
      { onConflict: 'user_id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings')
  return { success: true }
}
