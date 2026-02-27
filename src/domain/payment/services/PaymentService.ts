/**
 * Payment Service - Domain Layer
 * Handles payment-related business logic
 */

import Stripe from 'stripe'

// Price to words mapping
export const PRICE_MAP: Record<string, number> = {
  price_1T3vFHEu4Bc1R5b5dwDRWBMZ: 50000,
  price_1T3yZuEu4Bc1R5b5RwycAMtS: 50000,
  price_1T3vGgEu4Bc1R5b51SxFeirJ: 100000,
  price_1T3ybDEu4Bc1R5b5wkXFSId: 100000,
  price_1T3vHbEu4Bc1R5b5omOOSOiN: 350000,
  price_1T3ycoEu4Bc1R5b5KkG2Hzyv: 350000,
  price_1T3vIzEu4Bc1R5b5g756peyq: 1000000,
  price_1T3ygzEu4Bc1R5b5J5IBU9nN: 1000000,
  price_1T3vJlEu4Bc1R5b5cOTjvM6w: 3000000,
  price_1T3yhwEu4Bc1R5b5cWJr6mJC: 3000000,
}

// First purchase price IDs (50% discount)
export const FIRST_PRICE_IDS = new Set([
  'price_1T3yZuEu4Bc1R5b5RwycAMtS',
  'price_1T3ybDEu4Bc1R5b5wkXFSId',
  'price_1T3ycoEu4Bc1R5b5KkG2Hzyv',
  'price_1T3ygzEu4Bc1R5b5J5IBU9nN',
  'price_1T3yhwEu4Bc1R5b5cWJr6mJC',
])

export class PaymentService {
  private stripe: Stripe

  constructor(stripe: Stripe) {
    this.stripe = stripe
  }

  /**
   * Calculate words to add based on price ID and first purchase status
   */
  calculateWords(priceId: string, isFirstPurchase: boolean): number {
    const baseWords = PRICE_MAP[priceId] || 0
    return isFirstPurchase ? baseWords * 2 : baseWords
  }

  /**
   * Check if a price ID is a first purchase price
   */
  isFirstPurchasePrice(priceId: string): boolean {
    return FIRST_PRICE_IDS.has(priceId)
  }

  /**
   * Create a checkout session
   */
  async createCheckoutSession(params: {
    userId: string
    priceId: string
    isFirstPurchase: boolean
    successUrl: string
    cancelUrl: string
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: params.priceId, quantity: 1 }],
      metadata: {
        user_id: params.userId,
        price_id: params.priceId,
        is_first_purchase: String(params.isFirstPurchase),
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    })
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(body: string, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  }
}

// Factory function
export function createPaymentService(): PaymentService {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is required')
  }

  const stripe = new Stripe(key, {
    apiVersion: '2026-01-28.clover',
    timeout: 30000,
    maxNetworkRetries: 3,
  })

  return new PaymentService(stripe)
}
