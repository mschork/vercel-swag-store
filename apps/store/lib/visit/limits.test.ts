import { describe, expect, it } from 'vitest'
import { exceedsDraw, tooMany } from './limits'

describe('exceedsDraw', () => {
  it('allows a quantity up to the draw', () => {
    expect(exceedsDraw(4, 4)).toBe(false)
    expect(exceedsDraw(1, 4)).toBe(false)
  })

  it('refuses one above it, and anything at all when there is none', () => {
    expect(exceedsDraw(5, 4)).toBe(true)
    expect(exceedsDraw(1, 0)).toBe(true)
  })

  it('enforces nothing when the count is unknown', () => {
    expect(exceedsDraw(999, null)).toBe(false)
  })
})

describe('tooMany', () => {
  it('names the number available', () => {
    expect(tooMany(3)).toBe('Only 3 available.')
  })

  it('says out of stock rather than "only 0 available"', () => {
    expect(tooMany(0)).toBe('This product is out of stock.')
  })
})
