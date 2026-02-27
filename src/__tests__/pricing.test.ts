import { describe, it, expect } from 'vitest'
import { PACKAGES, formatWords } from '@/lib/pricing'

describe('pricing', () => {
  describe('formatWords', () => {
    it('should format words less than 10,000', () => {
      expect(formatWords(5000)).toBe('5,000')
      expect(formatWords(999)).toBe('999')
    })

    it('should format words in 萬 (10,000s)', () => {
      expect(formatWords(10000)).toBe('1萬')
      expect(formatWords(50000)).toBe('5萬')
      expect(formatWords(99999)).toBe('10萬')
    })

    it('should format words in 百萬 (millions)', () => {
      expect(formatWords(1000000)).toBe('1百萬')
      expect(formatWords(2000000)).toBe('2百萬')
      expect(formatWords(10000000)).toBe('10百萬')
    })
  })

  describe('PACKAGES', () => {
    it('should have 5 packages', () => {
      expect(PACKAGES).toHaveLength(5)
    })

    it('should have correct price structure', () => {
      PACKAGES.forEach(pkg => {
        expect(pkg).toHaveProperty('words')
        expect(pkg).toHaveProperty('normalPrice')
        expect(pkg).toHaveProperty('firstPrice')
        expect(pkg).toHaveProperty('normalPriceId')
        expect(pkg).toHaveProperty('firstPriceId')
        expect(pkg).toHaveProperty('discount')
      })
    })

    it('should have firstPrice cheaper than normalPrice', () => {
      PACKAGES.forEach(pkg => {
        expect(pkg.firstPrice).toBeLessThan(pkg.normalPrice)
      })
    })

    it('should have increasing words with increasing prices', () => {
      for (let i = 1; i < PACKAGES.length; i++) {
        expect(PACKAGES[i].words).toBeGreaterThan(PACKAGES[i - 1].words)
        expect(PACKAGES[i].normalPrice).toBeGreaterThan(PACKAGES[i - 1].normalPrice)
      }
    })
  })
})
