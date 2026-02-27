/**
 * Handle Webhook Use Case - Application Layer
 */

import Stripe from 'stripe'
import { createPaymentService } from '@/domain/payment/services/PaymentService'
import { Payment } from '@/domain/payment/entities/Payment'
import { paymentEventDispatcher } from '@/domain/payment/events/PaymentEvents'
import { 
  SupabasePaymentRepository, 
  SupabaseUserProfilePaymentRepository 
} from '@/infrastructure/payment/SupabasePaymentRepository'

export interface HandleWebhookInput {
  body: string
  signature: string
}

export interface HandleWebhookResult {
  received: boolean
  processed: boolean
}

export class HandleWebhookUseCase {
  private paymentService = createPaymentService()
  private paymentRepo = new SupabasePaymentRepository()
  private userProfileRepo = new SupabaseUserProfilePaymentRepository()

  async execute(input: HandleWebhookInput): Promise<HandleWebhookResult> {
    const { body, signature } = input

    // Verify signature
    let event: Stripe.Event
    try {
      event = this.paymentService.verifyWebhookSignature(body, signature)
    } catch (err) {
      console.error('❌ [webhook] Signature verification failed:', err)
      return { received: false, processed: false }
    }

    // Handle checkout completion
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      
      // Check for duplicate
      const existing = await this.paymentRepo.findBySessionId(session.id)
      if (existing) {
        console.log('⏭️ [webhook] Payment already processed:', session.id)
        return { received: true, processed: false }
      }

      const userId = session.metadata?.user_id
      const priceId = session.metadata?.price_id

      if (!userId || !priceId) {
        console.error('❌ [webhook] Missing metadata:', session.metadata)
        return { received: true, processed: false }
      }

      // Calculate words
      const isFirstPrice = this.paymentService.isFirstPurchasePrice(priceId)
      const userFirstPurchase = await this.userProfileRepo.getFirstPurchaseStatus(userId)
      const isFirstPurchase = isFirstPrice && userFirstPurchase
      const wordsAdded = this.paymentService.calculateWords(priceId, isFirstPurchase)

      // Add words to user
      await this.userProfileRepo.addWordCount(userId, wordsAdded, isFirstPurchase)

      // Record payment
      const payment = Payment.create({
        userId,
        stripeSessionId: session.id,
        amount: session.amount_total || 0,
        wordsAdded,
        priceId,
        isFirstPurchase
      })
      await this.paymentRepo.save(payment)

      // Dispatch event
      paymentEventDispatcher.dispatch({
        type: 'WORDS_ADDED',
        userId,
        amount: session.amount_total || 0,
        wordsAdded,
        stripeSessionId: session.id,
        timestamp: new Date()
      })

      console.log(`✅ [webhook] Payment processed: user=${userId} words=${wordsAdded}`)
      return { received: true, processed: true }
    }

    return { received: true, processed: false }
  }
}
