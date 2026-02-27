/**
 * Payment Entity - Domain Layer
 * Represents a payment transaction
 */

export interface PaymentProps {
  id?: string
  userId: string
  stripeSessionId: string
  amount: number
  wordsAdded: number
  priceId: string
  isFirstPurchase: boolean
  createdAt?: Date
}

export class Payment {
  readonly id?: string
  readonly userId: string
  readonly stripeSessionId: string
  readonly amount: number
  readonly wordsAdded: number
  readonly priceId: string
  readonly isFirstPurchase: boolean
  readonly createdAt: Date

  private constructor(props: PaymentProps) {
    this.id = props.id
    this.userId = props.userId
    this.stripeSessionId = props.stripeSessionId
    this.amount = props.amount
    this.wordsAdded = props.wordsAdded
    this.priceId = props.priceId
    this.isFirstPurchase = props.isFirstPurchase
    this.createdAt = props.createdAt ?? new Date()
  }

  static create(props: Omit<PaymentProps, 'id' | 'createdAt'>): Payment {
    return new Payment({
      ...props,
      createdAt: new Date()
    })
  }

  static fromDatabase(row: Record<string, unknown>): Payment {
    return new Payment({
      id: row.id as string,
      userId: row.user_id as string,
      stripeSessionId: row.stripe_session_id as string,
      amount: row.amount as number,
      wordsAdded: row.words_added as number,
      priceId: row.price_id as string,
      isFirstPurchase: row.is_first_purchase as boolean,
      createdAt: new Date(row.created_at as string)
    })
  }

  toProps(): PaymentProps {
    return {
      id: this.id,
      userId: this.userId,
      stripeSessionId: this.stripeSessionId,
      amount: this.amount,
      wordsAdded: this.wordsAdded,
      priceId: this.priceId,
      isFirstPurchase: this.isFirstPurchase,
      createdAt: this.createdAt
    }
  }
}
