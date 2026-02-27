/**
 * Create Checkout Use Case - Application Layer
 */

import { createPaymentService, type PaymentService } from '@/domain/payment/services/PaymentService'
import { SupabaseUserProfilePaymentRepository } from '@/infrastructure/payment/SupabasePaymentRepository'

export interface CreateCheckoutInput {
  userId: string
  priceId: string
}

export interface CreateCheckoutResult {
  url: string
}

export class CreateCheckoutUseCase {
  private paymentService: PaymentService
  private userProfileRepo: SupabaseUserProfilePaymentRepository

  constructor(
    paymentService?: PaymentService,
    userProfileRepo?: SupabaseUserProfilePaymentRepository
  ) {
    this.paymentService = paymentService || createPaymentService()
    this.userProfileRepo = userProfileRepo || new SupabaseUserProfilePaymentRepository()
  }

  async execute(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const { userId, priceId } = input

    // Get user's first purchase status
    const isFirstPurchase = await this.userProfileRepo.getFirstPurchaseStatus(userId)

    // Create checkout session
    const session = await this.paymentService.createCheckoutSession({
      userId,
      priceId,
      isFirstPurchase,
      successUrl: `${process.env.NEXTAUTH_URL || 'https://nyx-ai-woad.vercel.app'}/app?payment=success`,
      cancelUrl: `${process.env.NEXTAUTH_URL || 'https://nyx-ai-woad.vercel.app'}/app?payment=cancelled`,
    })

    return {
      url: session.url!
    }
  }
}
