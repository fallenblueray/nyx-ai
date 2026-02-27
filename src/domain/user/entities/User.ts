/**
 * User Entity - Domain Layer
 * Represents a user in the domain model
 */

export interface UserProfile {
  id: string
  email: string
  wordCount: number
  isFirstPurchase: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface UserProps {
  id: string
  email: string
  profile: UserProfile
}

export class User {
  readonly id: string
  readonly email: string
  readonly profile: UserProfile

  private constructor(props: UserProps) {
    this.id = props.id
    this.email = props.email
    this.profile = props.profile
  }

  static create(props: Omit<UserProps, 'profile'> & { wordCount?: number; isFirstPurchase?: boolean }): User {
    const profile: UserProfile = {
      id: props.id,
      email: props.email,
      wordCount: props.wordCount ?? 8000,
      isFirstPurchase: props.isFirstPurchase ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return new User({
      id: props.id,
      email: props.email,
      profile
    })
  }

  static fromDatabase(row: Record<string, unknown>): User {
    const profile: UserProfile = {
      id: row.id as string,
      email: row.email as string,
      wordCount: (row.word_count as number) ?? 8000,
      isFirstPurchase: (row.is_first_purchase as boolean) ?? true,
      createdAt: row.created_at ? new Date(row.created_at as string) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at as string) : undefined
    }

    return new User({
      id: row.id as string,
      email: row.email as string,
      profile
    })
  }

  // Business logic
  canGenerateStory(wordsNeeded: number): boolean {
    return this.profile.wordCount >= wordsNeeded
  }

  hasLowWordCount(threshold = 1000): boolean {
    return this.profile.wordCount < threshold
  }

  isEligibleForFirstPurchaseDiscount(): boolean {
    return this.profile.isFirstPurchase
  }

  deductWords(words: number): User {
    if (!this.canGenerateStory(words)) {
      throw new Error('字數不足')
    }

    return new User({
      id: this.id,
      email: this.email,
      profile: {
        ...this.profile,
        wordCount: this.profile.wordCount - words,
        updatedAt: new Date()
      }
    })
  }

  addWords(words: number, isFirstPurchase = false): User {
    return new User({
      id: this.id,
      email: this.email,
      profile: {
        ...this.profile,
        wordCount: this.profile.wordCount + words,
        isFirstPurchase: isFirstPurchase ? false : this.profile.isFirstPurchase,
        updatedAt: new Date()
      }
    })
  }
}
