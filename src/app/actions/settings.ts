'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

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
