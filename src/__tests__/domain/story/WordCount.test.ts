import { describe, it, expect } from 'vitest'
import { WordCount } from '@/domain/story/value-objects/WordCount'

describe('WordCount Value Object', () => {
  describe('create', () => {
    it('should create WordCount with positive value', () => {
      const wc = WordCount.create(5000)
      expect(wc.value).toBe(5000)
    })

    it('should not allow negative values', () => {
      const wc = WordCount.create(-100)
      expect(wc.value).toBe(0)
    })
  })

  describe('createFree', () => {
    it('should create free tier with 8000 words', () => {
      const wc = WordCount.createFree()
      expect(wc.value).toBe(8000)
    })
  })

  describe('deduct', () => {
    it('should deduct words when sufficient balance', () => {
      const wc = WordCount.create(5000)
      const newWc = wc.deduct(2000)
      expect(newWc.value).toBe(3000)
    })

    it('should throw when insufficient balance', () => {
      const wc = WordCount.create(1000)
      expect(() => wc.deduct(2000)).toThrow('字數不足')
    })
  })

  describe('add', () => {
    it('should add words', () => {
      const wc = WordCount.create(5000)
      const newWc = wc.add(3000)
      expect(newWc.value).toBe(8000)
    })
  })

  describe('isLowThreshold', () => {
    it('should detect low balance', () => {
      const wc = WordCount.create(500)
      expect(wc.isLowThreshold(1000)).toBe(true)
      expect(wc.isLowThreshold(100)).toBe(false)
    })
  })
})
