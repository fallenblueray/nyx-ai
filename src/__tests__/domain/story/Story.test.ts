import { describe, it, expect } from 'vitest'
import { Story, type StoryTopic, type StoryRole } from '@/domain/story/entities/Story'

describe('Story Entity', () => {
  const createMockTopics = (): StoryTopic[] => [
    { category: '場景', item: '都市' },
    { category: '風格', item: '奇幻' }
  ]

  const createMockRoles = (): StoryRole[] => [
    { name: '勇者', description: '主角', traits: ['勇敢', '正直'] }
  ]

  describe('create', () => {
    it('should create a story with required fields', () => {
      const story = Story.create({
        userId: 'user-123',
        title: 'Test Story',
        content: 'This is a test story content.',
        topics: createMockTopics(),
        roles: createMockRoles(),
        isPublic: false
      })

      expect(story.userId).toBe('user-123')
      expect(story.title).toBe('Test Story')
      expect(story.content).toBe('This is a test story content.')
      expect(story.isPublic).toBe(false)
      expect(story.createdAt).toBeInstanceOf(Date)
    })

    it('should generate shareId when making public', () => {
      const story = Story.create({
        userId: 'user-123',
        title: 'Test',
        content: 'Content',
        topics: [],
        roles: [],
        isPublic: false
      })

      const publicStory = story.makePublic()
      expect(publicStory.isPublic).toBe(true)
      expect(publicStory.shareId).toBeDefined()
    })
  })

  describe('fromDatabase', () => {
    it('should reconstruct story from database row', () => {
      const row = {
        id: 'story-123',
        user_id: 'user-456',
        title: 'DB Story',
        content: 'Database content',
        topics: JSON.stringify(createMockTopics()),
        roles: JSON.stringify(createMockRoles()),
        is_public: true,
        share_id: 'share-abc',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const story = Story.fromDatabase(row)

      expect(story.id).toBe('story-123')
      expect(story.userId).toBe('user-456')
      expect(story.title).toBe('DB Story')
      expect(story.isPublic).toBe(true)
      expect(story.shareId).toBe('share-abc')
      expect(story.topics).toEqual(createMockTopics())
    })
  })

  describe('business logic', () => {
    it('should calculate word count', () => {
      const story = Story.create({
        userId: 'user-123',
        title: 'Test',
        content: 'Hello World', // 11 characters
        topics: [],
        roles: [],
        isPublic: false
      })

      expect(story.wordCount).toBe(11)
    })

    it('should generate preview', () => {
      const longContent = 'A'.repeat(300)
      const story = Story.create({
        userId: 'user-123',
        title: 'Test',
        content: longContent,
        topics: [],
        roles: [],
        isPublic: false
      })

      expect(story.preview.length).toBe(203) // 200 + '...'
      expect(story.preview.endsWith('...')).toBe(true)
    })

    it('should check ownership', () => {
      const story = Story.create({
        userId: 'user-123',
        title: 'Test',
        content: 'Content',
        topics: [],
        roles: [],
        isPublic: false
      })

      expect(story.canBeSharedBy('user-123')).toBe(true)
      expect(story.canBeSharedBy('user-456')).toBe(false)
    })
  })
})
