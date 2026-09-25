import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Product, Promotion, StockInfo } from '@/lib/api/types'

const { jar } = vi.hoisted(() => ({ jar: new Map<string, string>() }))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
  }),
}))
vi.mock('@/lib/api/products', () => ({ getAllProducts: vi.fn() }))
vi.mock('@/lib/api/promotions', () => ({ getPromotion: vi.fn() }))
vi.mock('@/lib/api/stock', () => ({ getStock: vi.fn() }))

const { getAllProducts } = await import('@/lib/api/products')
const { getPromotion } = await import('@/lib/api/promotions')
const { getStock } = await import('@/lib/api/stock')
const { SESSION_COOKIE } = await import('@/lib/session/id')
const { sessionStore } = await import('@/lib/session/store')
const { completeVisit, drawFor, pinnedPromotion } = await import('./draw')

const mocked = {
  getAllProducts: vi.mocked(getAllProducts),
  getPromotion: vi.mocked(getPromotion),
  getStock: vi.mocked(getStock),
}

const promotion = (id: string): Promotion => ({
  id,
  title: 'Summer',
  description: 'Save 10% automatically',
  discountPercent: 10,
  code: 'SUMMER',
  validFrom: '2026-01-01',
  validUntil: '2026-12-31',
  active: true,
})

const products = (...ids: string[]) => ids.map((id) => ({ id }) as Product)
const stockOf = (count: number) => ({ stock: count }) as StockInfo
const failing = async (): Promise<never> => {
  throw new Error('the API is down')
}

let sid = ''
let counter = 0

/** The visit as the store now holds it. */
const kept = async () => {
  const state = await sessionStore.read(sid)
  return state === 'unavailable' ? undefined : state.visit
}

beforeEach(() => {
  vi.clearAllMocks()
  counter += 1
  sid = `00000000-0000-4000-a000-${String(counter).padStart(12, '0')}`
  jar.clear()
  jar.set(SESSION_COOKIE, sid)
  mocked.getAllProducts.mockResolvedValue(products('bottle_001', 'pin_001'))
  mocked.getPromotion.mockResolvedValue(promotion('promo_fresh'))
  mocked.getStock.mockImplementation(async (id: string) => stockOf(id === 'pin_001' ? 0 : 14))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('drawFor', () => {
  it('answers the draw the visit holds without asking the API', async () => {
    await sessionStore.claimStock(sid, { bottle_001: 3 })

    expect(await drawFor('bottle_001')).toBe(3)
    expect(mocked.getStock).not.toHaveBeenCalled()
  })

  it('draws a product the visit has no draw for and keeps it', async () => {
    expect(await drawFor('bottle_001')).toBe(14)
    expect((await kept())?.stock).toEqual({ bottle_001: 14 })
  })

  it('answers the draw that won when a parallel render claimed first', async () => {
    mocked.getStock.mockImplementation(async () => {
      await sessionStore.claimStock(sid, { bottle_001: 2 })
      return stockOf(14)
    })

    expect(await drawFor('bottle_001')).toBe(2)
    expect((await kept())?.stock).toEqual({ bottle_001: 2 })
  })

  it('clamps a draw to the most a cart can hold', async () => {
    mocked.getStock.mockResolvedValue(stockOf(5000))

    expect(await drawFor('bottle_001')).toBe(99)
  })

  it('answers the fresh draw without keeping it when there is no session', async () => {
    jar.clear()

    expect(await drawFor('bottle_001')).toBe(14)
    expect(await kept()).toBeNull()
  })

  it('answers null and keeps nothing when the API fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked.getStock.mockImplementation(failing)

    expect(await drawFor('bottle_001')).toBeNull()
    expect(await kept()).toBeNull()
  })
})

describe('pinnedPromotion', () => {
  it('answers the promotion the visit holds without asking the API', async () => {
    await sessionStore.claimPromotion(sid, promotion('promo_kept'))

    expect(await pinnedPromotion()).toEqual(promotion('promo_kept'))
    expect(mocked.getPromotion).not.toHaveBeenCalled()
  })

  it('reads one and pins it when the visit has none', async () => {
    expect(await pinnedPromotion()).toEqual(promotion('promo_fresh'))
    expect((await kept())?.promotion).toEqual(promotion('promo_fresh'))
  })

  it('pins the API saying there is none', async () => {
    mocked.getPromotion.mockResolvedValue(null)

    expect(await pinnedPromotion()).toBeNull()
    expect(await pinnedPromotion()).toBeNull()
    expect(mocked.getPromotion).toHaveBeenCalledTimes(1)
  })

  it('keeps nothing when the API fails, so the next render asks again', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked.getPromotion.mockImplementation(failing)

    expect(await pinnedPromotion()).toBeNull()
    expect(await kept()).toBeNull()
  })

  it("answers the API's promotion without keeping it when there is no session", async () => {
    jar.clear()

    expect(await pinnedPromotion()).toEqual(promotion('promo_fresh'))
    expect(await kept()).toBeNull()
  })
})

describe('completeVisit', () => {
  it('draws only the products the visit has no draw for', async () => {
    await sessionStore.claimStock(sid, { bottle_001: 3 })
    const visit = await kept()

    const complete = await completeVisit(sid, visit ?? null)

    expect(complete.stock).toEqual({ bottle_001: 3, pin_001: 0 })
    expect(mocked.getStock).toHaveBeenCalledTimes(1)
    expect(mocked.getStock).toHaveBeenCalledWith('pin_001')
    expect((await kept())?.stock).toEqual({ bottle_001: 3, pin_001: 0 })
  })

  it('draws from the ids it is given without reading the catalogue', async () => {
    const complete = await completeVisit(sid, null, ['pin_001'])

    expect(complete.stock).toEqual({ pin_001: 0 })
    expect(mocked.getAllProducts).not.toHaveBeenCalled()
  })

  it('answers the draws that won over a visit read before a parallel claim', async () => {
    await sessionStore.claimStock(sid, { bottle_001: 3 })

    const complete = await completeVisit(sid, null)

    expect(complete.stock).toEqual({ bottle_001: 3, pin_001: 0 })
  })

  it('leaves a draw that fails out', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked.getStock.mockImplementation(async (id: string) =>
      id === 'pin_001' ? failing() : stockOf(14),
    )

    const complete = await completeVisit(sid, null)

    expect(complete.stock).toEqual({ bottle_001: 14 })
    expect((await kept())?.stock).toEqual({ bottle_001: 14 })
  })

  it('pins the promotion once', async () => {
    const first = await completeVisit(sid, null)
    mocked.getPromotion.mockResolvedValue(promotion('promo_other'))
    const second = await completeVisit(sid, (await kept()) ?? null)

    expect(first.promotion).toEqual(promotion('promo_fresh'))
    expect(second.promotion).toEqual(promotion('promo_fresh'))
    expect(mocked.getPromotion).toHaveBeenCalledTimes(1)
  })

  it('keeps nothing without a session id and answers the fresh draws', async () => {
    const complete = await completeVisit(null, null)

    expect(complete).toEqual({
      stock: { bottle_001: 14, pin_001: 0 },
      promotion: promotion('promo_fresh'),
    })
    expect(await kept()).toBeNull()
  })

  it('answers the visit it was given when the catalogue cannot be read', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked.getAllProducts.mockImplementation(failing)

    const complete = await completeVisit(sid, {
      stock: { bottle_001: 3 },
      promotion: null,
      drawnAt: 1,
    })

    expect(complete).toEqual({ stock: { bottle_001: 3 }, promotion: null })
    expect(mocked.getStock).not.toHaveBeenCalled()
  })
})
