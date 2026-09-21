import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Promotion, StockInfo } from '@/lib/api/types'
import { CART_MAX_QUANTITY } from '@/lib/quantity'
import { OPENING_DRAW_DEADLINE_MS } from './opening-limits'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/api/promotions', () => ({ getPromotion: vi.fn() }))
vi.mock('@/lib/api/stock', () => ({ getStock: vi.fn() }))

const { getPromotion } = await import('@/lib/api/promotions')
const { getStock } = await import('@/lib/api/stock')
const { openingPromotion, openingStock } = await import('./opening')

const promotion = { id: 'promo_002', code: 'AUTO', active: true } as Promotion
const never = new Promise<never>(() => {})

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.useRealTimers())

describe('openingStock', () => {
  it('answers with the draw, clamped to what a cart line can hold', async () => {
    vi.mocked(getStock).mockResolvedValue({ stock: 14 } as StockInfo)
    await expect(openingStock('bottle_001')).resolves.toBe(14)

    vi.mocked(getStock).mockResolvedValue({ stock: 5000 } as StockInfo)
    await expect(openingStock('bottle_001')).resolves.toBe(CART_MAX_QUANTITY)
  })

  it('has no draw when the API fails', async () => {
    vi.mocked(getStock).mockRejectedValue(new Error('the API is down'))
    await expect(openingStock('bottle_001')).resolves.toBeUndefined()
  })

  it('stops waiting at the deadline', async () => {
    vi.mocked(getStock).mockReturnValue(never)
    const draw = openingStock('bottle_001')
    await vi.advanceTimersByTimeAsync(OPENING_DRAW_DEADLINE_MS)
    await expect(draw).resolves.toBeUndefined()
  })
})

describe('openingPromotion', () => {
  it('tells a promotion, none, and a failed read apart', async () => {
    vi.mocked(getPromotion).mockResolvedValueOnce(promotion)
    await expect(openingPromotion()).resolves.toEqual(promotion)

    vi.mocked(getPromotion).mockResolvedValueOnce(null)
    await expect(openingPromotion()).resolves.toBeNull()

    vi.mocked(getPromotion).mockRejectedValueOnce(new Error('the API is down'))
    await expect(openingPromotion()).resolves.toBeUndefined()
  })
})
