/**
 * User Repository Interface - Application Layer
 */

import { User } from '../entities/User'

export interface UserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  create(user: User): Promise<User>
  update(id: string, data: Partial<{ wordCount: number; isFirstPurchase: boolean }>): Promise<User>
}
