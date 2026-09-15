import { describe, expect, it } from 'vitest'
import { stockStatus } from './stock-status'

const stock = (
  overrides: Partial<{ stock: number; inStock: boolean; lowStock: boolean }>,
) => ({
  productId: 'tshirt_001',
  stock: 12,
  inStock: true,
  lowStock: false,
  ...overrides,
})

describe('stockStatus', () => {
  it('says in stock', () => {
    expect(stockStatus(stock({}))).toEqual({
      label: 'In stock',
      tone: 'success',
      availability: 'https://schema.org/InStock',
    })
  })

  it('names the count when stock is low, and stays in stock', () => {
    expect(stockStatus(stock({ stock: 3, lowStock: true }))).toEqual({
      label: 'Only 3 left',
      tone: 'warning',
      availability: 'https://schema.org/InStock',
    })
  })

  it('says out of stock whatever the other flags say', () => {
    expect(
      stockStatus(stock({ stock: 0, inStock: false, lowStock: true })),
    ).toEqual({
      label: 'Out of stock',
      tone: 'danger',
      availability: 'https://schema.org/OutOfStock',
    })
  })

  it('reports unknown stock without an availability', () => {
    expect(stockStatus(null)).toEqual({
      label: 'Stock unavailable',
      tone: 'muted',
      availability: null,
    })
  })
})
