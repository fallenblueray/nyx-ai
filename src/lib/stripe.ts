import Stripe from 'stripe'

// Always create new instance to avoid stale cache in serverless
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    console.error('❌ STRIPE_SECRET_KEY is not defined')
    throw new Error('❌ Missing STRIPE_SECRET_KEY environment variable')
  }
  
  // 驗證 key 格式
  if (!key.startsWith('sk_test_') && !key.startsWith('sk_live_')) {
    console.error('❌ Invalid STRIPE_SECRET_KEY format:', key.slice(0, 10))
    throw new Error(`❌ Invalid STRIPE_SECRET_KEY format: ${key.slice(0, 10)}...`)
  }
  
  console.log('💳 [stripe] Initializing with key:', key.slice(0, 12) + '...')
  
  return new Stripe(key, {
    apiVersion: '2026-01-28.clover',
    timeout: 30000,
    maxNetworkRetries: 3,
  })
}

/** @deprecated use getStripe() instead */
export const stripe = {
  get checkout() { return getStripe().checkout },
  get webhooks() { return getStripe().webhooks },
  get prices() { return getStripe().prices },
} as unknown as Stripe

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

// 是否首充 Price ID
export const FIRST_PRICE_IDS = new Set([
  'price_1T3yZuEu4Bc1R5b5RwycAMtS',
  'price_1T3ybDEu4Bc1R5b5wkXFSId',
  'price_1T3ycoEu4Bc1R5b5KkG2Hzyv',
  'price_1T3ygzEu4Bc1R5b5J5IBU9nN',
  'price_1T3yhwEu4Bc1R5b5cWJr6mJC',
])

export function getPriceIds(): Record<string, string> {
  try {
    return JSON.parse(process.env.STRIPE_PRICE_IDS || '{}')
  } catch {
    return {}
  }
}
