import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
})

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
