import { describe, it, expect } from 'vitest'
import { Payment } from '@/domain/payment/entities/Payment'

describe('Payment Entity', () => {
  describe('create', () => {
    it('should create a payment with required fields', () => {
      const payment = Payment.create({
        userId: 'user-123',
        stripeSessionId: 'cs_test_abc',
        amount: 2990,
        wordsAdded: 50000,
        priceId: 'price_123',
        isFirstPurchase: true
      })

      expect(payment.userId).toBe('user-123')
      expect(payment.stripeSessionId).toBe('cs_test_abc')
      expect(payment.amount).toBe(2990)
      expect(payment.wordsAdded).toBe(50000)
      expect(payment.isFirstPurchase).toBe(true)
    })

    it('should set createdAt automatically', () => {
      const payment = Payment.create({
        userId: 'user-123',
        stripeSessionId: 'cs_test_abc',
        amount: 2990,
        wordsAdded: 50000,
        priceId: 'price_123',
        isFirstPurchase: false
      })

      expect(payment.createdAt).toBeInstanceOf(Date)
    })
  })

  describe('fromDatabase', () => {
    it('should reconstruct payment from database row', () => {
      const row = {
        id: 'pay_123',
        user_id: 'user_456',
        stripe_session_id: 'cs_test_xyz',
        amount: 1990,
        words_added: 100000,
        price_id: 'price_789',
        is_first_purchase: true,
        created_at: '2024-01-15T10:30:00Z'
      }

      const payment = Payment.fromDatabase(row)

      expect(payment.id).toBe('pay_123')
      expect(payment.userId).toBe('user_456')
      expect(payment.stripeSessionId).toBe('cs_test_xyz')
      expect(payment.wordsAdded).toBe(100000)
      expect(payment.isFirstPurchase).toBe(true)
    })
  })
})
