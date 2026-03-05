'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { revalidatePath } from 'next/cache'

/**
 * V2.9: 更新偏好主題
 */
export async function updatePreferredTheme(themeId: string): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: '請先登入' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      { user_id: session.user.id, preferred_theme: themeId },
      { onConflict: 'user_id' }
    )

  if (error) return { success: false, error: error.message }

  revalidatePath('/settings')
  return { success: true }
}