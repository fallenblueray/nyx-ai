/**
 * Supabase Payment Repository - Infrastructure Layer
 */

import { createAdminClient } from '@/lib/supabase-admin'
import { Payment, type PaymentProps } from '../../domain/payment/entities/Payment'
import type { PaymentRepository, UserProfilePaymentRepository } from '../../domain/payment/repositories/PaymentRepository'

export class SupabasePaymentRepository implements PaymentRepository {
  private supabase = createAdminClient()

  async save(payment: Payment): Promise<Payment> {
    const props = payment.toProps()
    const { data, error } = await this.supabase
      .from('payments')
      .insert({
        user_id: props.userId,
        stripe_session_id: props.stripeSessionId,
        amount: props.amount,
        words_added: props.wordsAdded,
        price_id: props.priceId,
        is_first_purchase: props.isFirstPurchase,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`保存支付記錄失敗: ${error.message}`)
    }

    return Payment.fromDatabase(data)
  }

  async findBySessionId(sessionId: string): Promise<Payment | null> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .single()

    if (error || !data) {
      return null
    }

    return Payment.fromDatabase(data)
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`查詢支付記錄失敗: ${error.message}`)
    }

    return (data || []).map(row => Payment.fromDatabase(row))
  }
}

export class SupabaseUserProfilePaymentRepository implements UserProfilePaymentRepository {
  private supabase = createAdminClient()

  async getWordCount(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('word_count')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return 8000 // Default free tier
    }

    return data.word_count ?? 8000
  }

  async getFirstPurchaseStatus(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('is_first_purchase')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return true // Default to first purchase
    }

    return data.is_first_purchase ?? true
  }

  async addWordCount(userId: string, words: number, isFirstPurchase: boolean): Promise<number> {
    const current = await this.getWordCount(userId)
    const newWordCount = current + words

    const { error } = await this.supabase
      .from('profiles')
      .upsert({ 
        id: userId, 
        word_count: newWordCount,
        is_first_purchase: isFirstPurchase ? false : undefined
      })

    if (error) {
      throw new Error(`更新字數失敗: ${error.message}`)
    }

    return newWordCount
  }
}
