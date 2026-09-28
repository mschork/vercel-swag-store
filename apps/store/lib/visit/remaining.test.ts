import { describe, expect, it } from 'vitest'
import { LOW_STOCK_THRESHOLD, allows, cardStock, pageStock, refusal, remaining } from './remaining'

describe('remaining', () => {
  it('is the draw minus what the cart holds', () => {
    expect(remaining(12, 9)).toBe(3)
    expect(remaining(12, 0)).toBe(12)
  })

  it('never goes below nothing when the cart holds more than the draw', () => {
    expect(remaining(2, 7)).toBe(0)
  })

  it('is nothing when the draw is unknown', () => {
    expect(remaining(null, 0)).toBe(0)
  })
})

describe('allows', () => {
  it('allows a quantity up to the draw', () => {
    expect(allows(4, 4)).toBe(true)
    expect(allows(4, 1)).toBe(true)
  })

  it('refuses one above it, and anything at all when there is none', () => {
    expect(allows(4, 5)).toBe(false)
    expect(allows(0, 1)).toBe(false)
  })

  it('refuses any quantity when the draw is unknown', () => {
    expect(allows(null, 1)).toBe(false)
  })
})

describe('refusal', () => {
  it('names the number available when the cart holds none', () => {
    expect(refusal(3, 0)).toBe('Only 3 available.')
  })

  it('says out of stock rather than "only 0 available"', () => {
    expect(refusal(0, 0)).toBe('This product is out of stock.')
  })

  it('says the product is not available when the draw is unknown', () => {
    expect(refusal(null, 0)).toBe('This product is not available right now.')
  })

  it('names how many more there are when the cart holds some', () => {
    expect(refusal(12, 10)).toBe('Only 2 more available.')
  })

  it('names the cart when it holds the whole draw', () => {
    expect(refusal(12, 12)).toBe('All 12 are in your cart.')
  })
})

describe('pageStock', () => {
  it('says in stock and allows up to the draw', () => {
    expect(pageStock(12)).toEqual({
      label: 'In stock',
      tone: 'success',
      unavailableLabel: null,
      maxQuantity: 12,
    })
  })

  it('names the count at the low-stock threshold', () => {
    expect(pageStock(LOW_STOCK_THRESHOLD)).toMatchObject({
      label: `Only ${LOW_STOCK_THRESHOLD} left`,
      tone: 'warning',
    })
  })

  it('is plainly in stock one above the threshold', () => {
    expect(pageStock(LOW_STOCK_THRESHOLD + 1).label).toBe('In stock')
  })

  it('is out of stock at a draw of 0, and cannot be added', () => {
    expect(pageStock(0)).toEqual({
      label: 'This item is out of stock at the moment. Check back soon.',
      tone: 'danger',
      unavailableLabel: 'Currently unavailable',
      maxQuantity: 0,
    })
  })

  it('says so when the count is unknown, and cannot be added', () => {
    expect(pageStock(null)).toEqual({
      label: 'Stock unavailable',
      tone: 'muted',
      unavailableLabel: 'Currently unavailable',
      maxQuantity: 0,
    })
  })

  it('subtracts what the cart holds', () => {
    expect(pageStock(12, 9)).toMatchObject({ label: 'Only 3 left', maxQuantity: 3 })
  })

  it('names the cart when it holds the whole draw', () => {
    expect(pageStock(4, 4)).toEqual({
      label: 'All 4 are in your cart',
      tone: 'warning',
      unavailableLabel: 'All in your cart',
      maxQuantity: 0,
    })
  })

  it('never goes below nothing left when the cart holds more than the draw', () => {
    expect(pageStock(2, 7)).toMatchObject({
      label: 'All 2 are in your cart',
      maxQuantity: 0,
    })
  })
})

describe('cardStock', () => {
  it('shows nothing for a product a visitor can simply buy', () => {
    expect(cardStock(12, 0)).toBeNull()
    expect(cardStock(LOW_STOCK_THRESHOLD + 1, 0)).toBeNull()
  })

  it('names what is left at the low-stock threshold, counting the cart', () => {
    expect(cardStock(12, 9)).toEqual({ label: 'Only 3 left', tone: 'warning' })
    expect(cardStock(LOW_STOCK_THRESHOLD, 0)).toEqual({
      label: `Only ${LOW_STOCK_THRESHOLD} left`,
      tone: 'warning',
    })
  })

  it('is out of stock at a draw of 0', () => {
    expect(cardStock(0, 0)).toEqual({ label: 'Out of stock', tone: 'danger' })
  })

  it('says "In your cart" when the cart holds the whole draw', () => {
    expect(cardStock(4, 4)).toEqual({ label: 'In your cart', tone: 'muted' })
  })

  it('shows nothing when the draw is unknown', () => {
    expect(cardStock(null, 0)).toBeNull()
  })
})
