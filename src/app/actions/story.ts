'use server'

import { createServerClient } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'

export interface StoryData {
  id?: string
  title: string
  content: string
  topics: Array<{ category: string; item: string }>
  roles: Array<{ name: string; description: string; traits: string[] }>
  is_public?: boolean
}

export async function saveStory(data: StoryData) {
  const session = await getServerSession()
  
  if (!session?.user?.id) {
    return { error: '請先登入' }
  }

  const supabase = await createServerClient()

  const storyData = {
    user_id: session.user.id,
    title: data.title,
    content: data.content,
    topics: JSON.stringify(data.topics),
    roles: JSON.stringify(data.roles),
    is_public: data.is_public || false,
  }

  const { data: story, error } = await supabase
    .from('stories')
    .insert(storyData)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { story }
}

export async function updateStory(id: string, data: Partial<StoryData>) {
  const session = await getServerSession()
  
  if (!session?.user?.id) {
    return { error: '請先登入' }
  }

  const supabase = await createServerClient()

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
  const session = await getServerSession()
  
  if (!session?.user?.id) {
    return { error: '請先登入' }
  }

  const supabase = await createServerClient()

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
  const supabase = await createServerClient()

  const { data: story, error } = await supabase
    .from('stories')
    .select('*')
    .eq('share_id', shareId)
    .eq('is_public', true)
    .single()

  if (error || !story) {
    return { error: '找不到故事' }
  }

  return { story }
}

export async function shareStory(id: string) {
  const session = await getServerSession()
  
  if (!session?.user?.id) {
    return { error: '請先登入' }
  }

  const supabase = await createServerClient()

  const { data: story, error } = await supabase
    .from('stories')
    .update({ is_public: true })
    .eq('id', id)
    .eq('user_id', session.user.id)
    .select('share_id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/app')
  return { shareId: story?.share_id }
}
