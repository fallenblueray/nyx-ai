/**
 * Payment Repository Interface - Application Layer
 */

import { Payment, type PaymentProps } from '../entities/Payment'

export interface PaymentRepository {
  save(payment: Payment): Promise<Payment>
  findBySessionId(sessionId: string): Promise<Payment | null>
  findByUserId(userId: string): Promise<Payment[]>
}

export interface UserProfilePaymentRepository {
  getWordCount(userId: string): Promise<number>
  getFirstPurchaseStatus(userId: string): Promise<boolean>
  addWordCount(userId: string, words: number, isFirstPurchase: boolean): Promise<number>
}
