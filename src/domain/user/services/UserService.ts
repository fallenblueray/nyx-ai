/**
 * User Service - Domain Layer
 * Handles user-related business logic
 */

import { createAdminClient } from '@/lib/supabase-admin'

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthResult {
  userId: string
  email: string
}

export class UserService {
  private supabase = createAdminClient()

  /**
   * Authenticate user with email and password
   */
  async authenticate(credentials: AuthCredentials): Promise<AuthResult | null> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })

    if (error || !data.user) {
      console.error('Auth error:', error)
      return null
    }

    return {
      userId: data.user.id,
      email: data.user.email!
    }
  }

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<{
    wordCount: number
    isFirstPurchase: boolean
  } | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('word_count, is_first_purchase')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      wordCount: data.word_count ?? 8000,
      isFirstPurchase: data.is_first_purchase ?? true
    }
  }

  /**
   * Create user profile (for new users)
   */
  async createProfile(userId: string, email: string): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        word_count: 8000, // Free tier
        is_first_purchase: true
      })

    if (error) {
      console.error('Create profile error:', error)
      throw new Error('創建用戶資料失敗')
    }
  }

  /**
   * Update user word count
   */
  async updateWordCount(userId: string, wordCount: number): Promise<void> {
    const { error } = await this.supabase
      .from('profiles')
      .upsert({ id: userId, word_count: wordCount })

    if (error) {
      console.error('Update word count error:', error)
      throw new Error('更新字數失敗')
    }
  }
}

// Factory function
export function createUserService(): UserService {
  return new UserService()
}
