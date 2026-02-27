import { describe, it, expect } from 'vitest'
import { PaymentService, PRICE_MAP, FIRST_PRICE_IDS } from '@/domain/payment/services/PaymentService'

// Mock Stripe
const mockStripe = {
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue({ id: 'cs_test', url: 'https://checkout.stripe.com/test' })
    }
  },
  webhooks: {
    constructEvent: vi.fn()
  }
} as any

describe('PaymentService', () => {
  const service = new PaymentService(mockStripe)

  describe('calculateWords', () => {
    it('should return base words for normal price', () => {
      const words = service.calculateWords('price_1T3vFHEu4Bc1R5b5dwDRWBMZ', false)
      expect(words).toBe(50000)
    })

    it('should double words for first purchase', () => {
      const words = service.calculateWords('price_1T3yZuEu4Bc1R5b5RwycAMtS', true)
      expect(words).toBe(100000) // 50000 * 2
    })

    it('should return 0 for unknown price', () => {
      const words = service.calculateWords('unknown_price', false)
      expect(words).toBe(0)
    })
  })

  describe('isFirstPurchasePrice', () => {
    it('should return true for first purchase price IDs', () => {
      expect(service.isFirstPurchasePrice('price_1T3yZuEu4Bc1R5b5RwycAMtS')).toBe(true)
    })

    it('should return false for normal price IDs', () => {
      expect(service.isFirstPurchasePrice('price_1T3vFHEu4Bc1R5b5dwDRWBMZ')).toBe(false)
    })
  })

  describe('createCheckoutSession', () => {
    it('should create checkout session with correct metadata', async () => {
      const result = await service.createCheckoutSession({
        userId: 'user_123',
        priceId: 'price_abc',
        isFirstPurchase: true,
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      })

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: 'price_abc', quantity: 1 }],
        metadata: {
          user_id: 'user_123',
          price_id: 'price_abc',
          is_first_purchase: 'true',
        },
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      })

      expect(result.id).toBe('cs_test')
    })
  })
})
