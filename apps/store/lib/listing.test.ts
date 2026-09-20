import { describe, expect, it } from 'vitest'
import { isSortOrder, productCountLabel, sortProducts } from './listing'

const items = [
  { id: 'a', price: 3000 },
  { id: 'b', price: 1200 },
  { id: 'c', price: 3000 },
  { id: 'd', price: 500 },
]
const ids = (list: readonly { id: string }[]) => list.map((item) => item.id)

describe('sortProducts', () => {
  it('returns the input order for "default"', () => {
    expect(ids(sortProducts(items, 'default'))).toEqual(['a', 'b', 'c', 'd'])
  })

  it('sorts by price ascending and keeps the input order on ties', () => {
    expect(ids(sortProducts(items, 'price-asc'))).toEqual(['d', 'b', 'a', 'c'])
  })

  it('sorts by price descending and keeps the input order on ties', () => {
    expect(ids(sortProducts(items, 'price-desc'))).toEqual(['a', 'c', 'b', 'd'])
  })

  it('never mutates its input', () => {
    const before = ids(items)
    sortProducts(items, 'price-asc')
    expect(ids(items)).toEqual(before)
  })
})

describe('isSortOrder', () => {
  it('accepts the three orders and nothing else', () => {
    expect(isSortOrder('price-asc')).toBe(true)
    expect(isSortOrder('name')).toBe(false)
  })
})

describe('productCountLabel', () => {
  it('handles the singular', () => {
    expect(productCountLabel(1)).toBe('1 product')
    expect(productCountLabel(0)).toBe('0 products')
    expect(productCountLabel(28)).toBe('28 products')
  })
})
