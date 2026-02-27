/**
 * Payment Events - Domain Layer
 * Domain events for payment workflow
 */

export type PaymentEventType = 
  | 'PAYMENT_STARTED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'WORDS_ADDED'

export interface PaymentEvent {
  type: PaymentEventType
  userId: string
  amount?: number
  wordsAdded?: number
  stripeSessionId?: string
  timestamp: Date
}

export class PaymentEventDispatcher {
  private events: PaymentEvent[] = []

  dispatch(event: PaymentEvent): void {
    this.events.push(event)
    console.log(`📢 [PaymentEvent] ${event.type}:`, {
      userId: event.userId,
      amount: event.amount,
      wordsAdded: event.wordsAdded
    })
  }

  getEvents(): PaymentEvent[] {
    return [...this.events]
  }

  clear(): void {
    this.events = []
  }
}

// Singleton instance
export const paymentEventDispatcher = new PaymentEventDispatcher()
