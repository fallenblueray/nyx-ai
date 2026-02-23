export const PACKAGES = [
  {
    words: 50000,
    normalPrice: 29.9,
    firstPrice: 14.9,
    normalPriceId: 'price_1T3vFHEu4Bc1R5b5dwDRWBMZ',
    firstPriceId: 'price_1T3yZuEu4Bc1R5b5RwycAMtS',
    discount: '5折',
  },
  {
    words: 100000,
    normalPrice: 39.9,
    firstPrice: 19.95,
    normalPriceId: 'price_1T3vGgEu4Bc1R5b51SxFeirJ',
    firstPriceId: 'price_1T3ybDEu4Bc1R5b5wkXFSId',
    discount: '5折',
  },
  {
    words: 350000,
    normalPrice: 109,
    firstPrice: 54.5,
    normalPriceId: 'price_1T3vHbEu4Bc1R5b5omOOSOiN',
    firstPriceId: 'price_1T3ycoEu4Bc1R5b5KkG2Hzyv',
    discount: '5折',
  },
  {
    words: 1000000,
    normalPrice: 249,
    firstPrice: 124.5,
    normalPriceId: 'price_1T3vIzEu4Bc1R5b5g756peyq',
    firstPriceId: 'price_1T3ygzEu4Bc1R5b5J5IBU9nN',
    discount: '5折',
  },
  {
    words: 3000000,
    normalPrice: 666,
    firstPrice: 333,
    normalPriceId: 'price_1T3vJlEu4Bc1R5b5cOTjvM6w',
    firstPriceId: 'price_1T3yhwEu4Bc1R5b5cWJr6mJC',
    discount: '5折',
  },
]

export function formatWords(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(0)}百萬`
  if (n >= 10000) return `${(n / 10000).toFixed(0)}萬`
  return `${n.toLocaleString()}`
}
