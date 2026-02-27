/**
 * Story Repository Interface - Application Layer
 * Defines the contract for story data access
 */

import { Story, type StoryProps } from '../entities/Story'

export interface StoryRepository {
  save(story: Story): Promise<Story>
  findById(id: string): Promise<Story | null>
  findByUserId(userId: string): Promise<Story[]>
  findByShareId(shareId: string): Promise<Story | null>
  update(id: string, props: Partial<StoryProps>): Promise<Story>
  delete(id: string, userId: string): Promise<void>
}

export interface UserProfileRepository {
  getWordCount(userId: string): Promise<number>
  deductWordCount(userId: string, words: number): Promise<number>
  addWordCount(userId: string, words: number): Promise<number>
}
