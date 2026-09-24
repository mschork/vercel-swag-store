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
const { DELETE } = await import('./route')

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

let sid = ''
let counter = 0

beforeEach(() => {
  vi.clearAllMocks()
  counter += 1
  sid = `00000000-0000-4000-9000-${String(counter).padStart(12, '0')}`
  jar.clear()
  jar.set(SESSION_COOKIE, sid)
  mocked.getAllProducts.mockResolvedValue(products('bottle_001', 'pin_001'))
  mocked.getPromotion.mockResolvedValue(promotion('promo_fresh'))
  mocked.getStock.mockImplementation(async (id: string) => stockOf(id === 'pin_001' ? 0 : 14))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DELETE /api/visit', () => {
  it('clears the old draws and answers fresh ones, which the store keeps', async () => {
    await sessionStore.claimStock(sid, { bottle_001: 3, pin_001: 5 })
    await sessionStore.claimPromotion(sid, promotion('promo_old'))

    const response = await DELETE()

    const fresh = { stock: { bottle_001: 14, pin_001: 0 }, promotion: promotion('promo_fresh') }
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(fresh)
    expect(await sessionStore.read(sid)).toMatchObject({ visit: fresh })
  })

  it('leaves a draw that fails out', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked.getStock.mockImplementation(async (id: string) => {
      if (id === 'pin_001') throw new Error('the API is down')
      return stockOf(14)
    })

    const body = await (await DELETE()).json()

    expect(body.stock).toEqual({ bottle_001: 14 })
  })

  it('answers 503 without a session', async () => {
    jar.clear()

    const response = await DELETE()

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ ok: false })
    expect(mocked.getStock).not.toHaveBeenCalled()
  })
})
