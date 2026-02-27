import { describe, it, expect } from 'vitest'
import { User } from '@/domain/user/entities/User'

describe('User Entity', () => {
  describe('create', () => {
    it('should create a user with default values', () => {
      const user = User.create({
        id: 'user-123',
        email: 'test@example.com'
      })

      expect(user.id).toBe('user-123')
      expect(user.email).toBe('test@example.com')
      expect(user.profile.wordCount).toBe(8000)
      expect(user.profile.isFirstPurchase).toBe(true)
    })

    it('should create a user with custom values', () => {
      const user = User.create({
        id: 'user-123',
        email: 'test@example.com',
        wordCount: 50000,
        isFirstPurchase: false
      })

      expect(user.profile.wordCount).toBe(50000)
      expect(user.profile.isFirstPurchase).toBe(false)
    })
  })

  describe('fromDatabase', () => {
    it('should reconstruct user from database row', () => {
      const row = {
        id: 'user-456',
        email: 'db@example.com',
        word_count: 100000,
        is_first_purchase: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }

      const user = User.fromDatabase(row)

      expect(user.id).toBe('user-456')
      expect(user.email).toBe('db@example.com')
      expect(user.profile.wordCount).toBe(100000)
      expect(user.profile.isFirstPurchase).toBe(false)
    })
  })

  describe('business logic', () => {
    it('should check if user can generate story', () => {
      const user = User.create({
        id: 'user-123',
        email: 'test@example.com',
        wordCount: 5000
      })

      expect(user.canGenerateStory(3000)).toBe(true)
      expect(user.canGenerateStory(6000)).toBe(false)
    })

    it('should check low word count threshold', () => {
      const user = User.create({
        id: 'user-123',
        email: 'test@example.com',
        wordCount: 500
      })

      expect(user.hasLowWordCount(1000)).toBe(true)
      expect(user.hasLowWordCount(100)).toBe(false)
    })

    it('should deduct words', () => {
      const user = User.create({
        id: 'user-123',
        email: 'test@example.com',
        wordCount: 5000
      })

      const updatedUser = user.deductWords(2000)
      expect(updatedUser.profile.wordCount).toBe(3000)
    })

    it('should throw when deducting insufficient words', () => {
      const user = User.create({
        id: 'user-123',
        email: 'test@example.com',
        wordCount: 1000
      })

      expect(() => user.deductWords(2000)).toThrow('字數不足')
    })

    it('should add words and update first purchase status', () => {
      const user = User.create({
        id: 'user-123',
        email: 'test@example.com',
        wordCount: 5000,
        isFirstPurchase: true
      })

      const updatedUser = user.addWords(10000, true)
      expect(updatedUser.profile.wordCount).toBe(15000)
      expect(updatedUser.profile.isFirstPurchase).toBe(false)
    })
  })
})
