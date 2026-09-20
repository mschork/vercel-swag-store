import { describe, expect, it } from 'vitest'
import type { Promotion } from '@/lib/api/types'
import {
  afterOrder,
  encodeVisit,
  MAX_VISIT_BYTES,
  parseVisit,
  serialiseVisit,
  VISIT_MAX_AGE_SECONDS,
  type Visit,
} from './visit'

const NOW = 1_790_000_000_000
const DRAWN_AT = Math.floor(NOW / 1000)

const promotion: Promotion = {
  id: 'promo_002',
  title: 'Free Stickers with Every Order',
  description: 'Every order over $50 ships with a free Vercel sticker pack. No code needed.',
  discountPercent: 0,
  code: 'AUTO',
  validFrom: '2025-01-01T00:00:00Z',
  validUntil: '2025-12-31T00:00:00Z',
  active: true,
}

const visit = (overrides: Partial<Visit> = {}): Visit => ({
  v: 1,
  drawnAt: DRAWN_AT,
  stock: { bottle_001: 14, pin_001: 0 },
  promotion,
  ...overrides,
})

/** The cookie carries base64url, so a test's input goes through the same door. */
const cookie = (value: Visit | unknown) => encodeVisit(JSON.stringify(value))

describe('parseVisit', () => {
  it('reads a visit it wrote', () => {
    expect(parseVisit(cookie(visit()), NOW)).toEqual(visit())
  })

  it('reads a visit whose promotion never loaded', () => {
    expect(parseVisit(cookie(visit({ promotion: null })), NOW)?.promotion).toBeNull()
  })

  it('has no visit when there is no cookie', () => {
    expect(parseVisit(undefined, NOW)).toBeNull()
    expect(parseVisit('', NOW)).toBeNull()
  })

  it('has no visit when the value is not JSON', () => {
    expect(parseVisit(encodeVisit('{oh dear'), NOW)).toBeNull()
  })

  it('has no visit when the value is not the encoding we write', () => {
    expect(parseVisit('{"v":1}', NOW)).toBeNull()
    expect(parseVisit('not base64!!', NOW)).toBeNull()
  })

  it('survives a promotion whose text carries a per-cent sign', () => {
    const percent = { ...promotion, description: 'Save 10% automatically.' }
    const { value } = serialiseVisit(visit({ promotion: percent }))
    expect(value).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(parseVisit(value, NOW)?.promotion?.description).toBe('Save 10% automatically.')
  })

  it('has no visit when a count is not a whole number in range', () => {
    expect(parseVisit(cookie(visit({ stock: { bottle_001: -1 } })), NOW)).toBeNull()
    expect(parseVisit(cookie(visit({ stock: { bottle_001: 1.5 } })), NOW)).toBeNull()
    expect(parseVisit(cookie(visit({ stock: { bottle_001: 1000 } })), NOW)).toBeNull()
  })

  it('has no visit when the shape is from another version', () => {
    expect(parseVisit(cookie({ ...visit(), v: 2 }), NOW)).toBeNull()
  })

  it('keeps a visit right up to a day old, and drops it after', () => {
    const almost = NOW + (VISIT_MAX_AGE_SECONDS - 1) * 1000
    expect(parseVisit(cookie(visit()), almost)).not.toBeNull()
    expect(parseVisit(cookie(visit()), NOW + VISIT_MAX_AGE_SECONDS * 1000)).toBeNull()
  })
})

describe('serialiseVisit', () => {
  it('writes a small visit whole', () => {
    const { value, dropped } = serialiseVisit(visit())
    expect(dropped).toEqual([])
    expect(parseVisit(value, NOW)).toEqual(visit())
  })

  it('writes only characters no encoding step can alter', () => {
    expect(serialiseVisit(visit()).value).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('drops the products that do not fit, keeping the promotion', () => {
    const stock = Object.fromEntries(
      Array.from({ length: 400 }, (_, index) => [`product_${index}`, index % 30]),
    )
    const { value, dropped } = serialiseVisit(visit({ stock }))

    expect(value.length).toBeLessThanOrEqual(MAX_VISIT_BYTES)
    expect(dropped.length).toBeGreaterThan(0)
    const parsed = parseVisit(value, NOW)
    expect(parsed?.promotion).toEqual(promotion)
    expect(Object.keys(parsed?.stock ?? {})).toHaveLength(400 - dropped.length)
  })

  it('drops from the end, so the first products keep their counts', () => {
    const stock = Object.fromEntries(
      Array.from({ length: 400 }, (_, index) => [`product_${index}`, 7]),
    )
    const { value, dropped } = serialiseVisit(visit({ stock }))
    expect(parseVisit(value, NOW)?.stock.product_0).toBe(7)
    expect(dropped).toContain('product_399')
  })
})

describe('afterOrder', () => {
  it('takes each line off the draw it came from', () => {
    const before = visit({ stock: { bottle_001: 14, pin_001: 3 } })
    const after = afterOrder(before, [
      { productId: 'bottle_001', quantity: 4 },
      { productId: 'pin_001', quantity: 3 },
    ])
    expect(after.stock).toEqual({ bottle_001: 10, pin_001: 0 })
  })

  it('never goes below nothing, and leaves the rest of the visit alone', () => {
    const before = visit({ stock: { bottle_001: 2 } })
    const after = afterOrder(before, [{ productId: 'bottle_001', quantity: 9 }])
    expect(after.stock.bottle_001).toBe(0)
    expect(after.promotion).toEqual(promotion)
    expect(after.drawnAt).toBe(before.drawnAt)
  })

  it('ignores a line the visit has no count for', () => {
    const before = visit({ stock: { bottle_001: 5 } })
    const after = afterOrder(before, [{ productId: 'unknown_001', quantity: 1 }])
    expect(after.stock).toEqual({ bottle_001: 5 })
  })
})
