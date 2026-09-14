import { describe, expect, it } from 'vitest'
import { formatPrice } from './format'

describe('formatPrice', () => {
  it.each([
    [0, '$0.00'],
    [800, '$8.00'],
    [6500, '$65.00'],
    [123456, '$1,234.56'],
  ])('formats %i cents as %s', (cents, expected) => {
    expect(formatPrice(cents)).toBe(expected)
  })

  it('honours currency and locale', () => {
    expect(formatPrice(2800, 'EUR', 'de-DE')).toMatch(/^28,00\s€$/)
  })
})
