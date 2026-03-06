'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { revalidatePath } from 'next/cache'

// 更新用戶偏好設定（語言、主題等）
export async function updateUserPreference(
  key: 'preferred_language' | 'theme',
  value: string
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new Error('用戶未登入')
    }

    // 使用 admin client 更新 public.profiles 表
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('profiles')
      .update({ [key]: value })
      .eq('id', session.user.id)

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
