import { describe, expect, it } from 'vitest'
import { LOW_STOCK_THRESHOLD, stockStatus } from './stock-status'

describe('stockStatus', () => {
  it('says in stock and allows up to the draw', () => {
    expect(stockStatus(12)).toEqual({
      label: 'In stock',
      tone: 'success',
      availability: 'https://schema.org/InStock',
      canAddToCart: true,
      maxQuantity: 12,
    })
  })

  it('names the count at the low-stock threshold, and stays in stock', () => {
    expect(stockStatus(LOW_STOCK_THRESHOLD)).toMatchObject({
      label: `Only ${LOW_STOCK_THRESHOLD} left`,
      tone: 'warning',
      availability: 'https://schema.org/InStock',
      canAddToCart: true,
    })
  })

  it('is plainly in stock one above the threshold', () => {
    expect(stockStatus(LOW_STOCK_THRESHOLD + 1).label).toBe('In stock')
  })

  it('is out of stock at a draw of 0, and cannot be added', () => {
    expect(stockStatus(0)).toEqual({
      label: 'Out of stock',
      tone: 'danger',
      availability: 'https://schema.org/OutOfStock',
      canAddToCart: false,
      maxQuantity: 0,
    })
  })

  it('says so when the count is unknown, and cannot be added', () => {
    expect(stockStatus(null)).toEqual({
      label: 'Stock unavailable',
      tone: 'muted',
      availability: null,
      canAddToCart: false,
      maxQuantity: 0,
    })
  })

  it('subtracts what the cart holds', () => {
    expect(stockStatus(12, 9)).toMatchObject({ label: 'Only 3 left', maxQuantity: 3 })
  })

  it('names the cart when it holds the whole draw, and still calls the product in stock', () => {
    expect(stockStatus(4, 4)).toEqual({
      label: 'All 4 are in your cart',
      tone: 'warning',
      availability: 'https://schema.org/InStock',
      canAddToCart: false,
      maxQuantity: 0,
    })
  })

  it('never goes below nothing left when the cart holds more than the draw', () => {
    expect(stockStatus(2, 7)).toMatchObject({
      label: 'All 2 are in your cart',
      canAddToCart: false,
      maxQuantity: 0,
    })
  })
})
