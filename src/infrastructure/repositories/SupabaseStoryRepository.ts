/**
 * Supabase Story Repository - Infrastructure Layer
 * Implements StoryRepository using Supabase
 */

import { createAdminClient } from '@/lib/supabase-admin'
import { Story, type StoryProps } from '../../domain/story/entities/Story'
import type { StoryRepository, UserProfileRepository } from '../../domain/story/repositories/StoryRepository'

export class SupabaseStoryRepository implements StoryRepository {
  private supabase = createAdminClient()

  async save(story: Story): Promise<Story> {
    const props = story.toProps()
    const { data, error } = await this.supabase
      .from('stories')
      .insert({
        user_id: props.userId,
        title: props.title,
        content: props.content,
        topics: JSON.stringify(props.topics),
        roles: JSON.stringify(props.roles),
        is_public: props.isPublic,
        share_id: props.shareId
      })
      .select()
      .single()

    if (error) {
      throw new Error(`保存故事失敗: ${error.message}`)
    }

    return Story.fromDatabase(data)
  }

  async findById(id: string): Promise<Story | null> {
    const { data, error } = await this.supabase
      .from('stories')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return null
    }

    return Story.fromDatabase(data)
  }

  async findByUserId(userId: string): Promise<Story[]> {
    const { data, error } = await this.supabase
      .from('stories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`查詢故事失敗: ${error.message}`)
    }

    return (data || []).map(row => Story.fromDatabase(row))
  }

  async findByShareId(shareId: string): Promise<Story | null> {
    const { data, error } = await this.supabase
      .from('stories')
      .select('*')
      .eq('share_id', shareId)
      .eq('is_public', true)
      .single()

    if (error || !data) {
      return null
    }

    return Story.fromDatabase(data)
  }

  async update(id: string, props: Partial<StoryProps>): Promise<Story> {
    const updateData: Record<string, unknown> = {}
    
    if (props.title) updateData.title = props.title
    if (props.content) updateData.content = props.content
    if (props.topics) updateData.topics = JSON.stringify(props.topics)
    if (props.roles) updateData.roles = JSON.stringify(props.roles)
    if (props.isPublic !== undefined) updateData.is_public = props.isPublic

    const { data, error } = await this.supabase
      .from('stories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`更新故事失敗: ${error.message}`)
    }

    return Story.fromDatabase(data)
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('stories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`刪除故事失敗: ${error.message}`)
    }
  }
}

export class SupabaseUserProfileRepository implements UserProfileRepository {
  private supabase = createAdminClient()

  async getWordCount(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('word_count')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return 8000 // Default free tier
    }

    return data.word_count ?? 8000
  }

  async deductWordCount(userId: string, words: number): Promise<number> {
    const current = await this.getWordCount(userId)
    const newCount = Math.max(0, current - words)

    const { error } = await this.supabase
      .from('profiles')
      .upsert({ id: userId, word_count: newCount })

    if (error) {
      throw new Error(`扣除字數失敗: ${error.message}`)
    }

    return newCount
  }

  async addWordCount(userId: string, words: number): Promise<number> {
    const current = await this.getWordCount(userId)
    const newCount = current + words

    const { error } = await this.supabase
      .from('profiles')
      .upsert({ id: userId, word_count: newCount })

    if (error) {
      throw new Error(`增加字數失敗: ${error.message}`)
    }

    return newCount
  }
}
