import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Product, Promotion, StockInfo } from '@/lib/api/types'
import type { Visit } from '@/lib/visit/visit'

vi.mock('@/lib/api/products', () => ({ getAllProducts: vi.fn() }))
vi.mock('@/lib/api/promotions', () => ({ getPromotion: vi.fn() }))
vi.mock('@/lib/api/stock', () => ({ getStock: vi.fn() }))
vi.mock('@/lib/visit/cookie', () => ({
  getVisit: vi.fn(),
  setVisit: vi.fn(),
  clearVisit: vi.fn(),
}))

const { getAllProducts } = await import('@/lib/api/products')
const { getPromotion } = await import('@/lib/api/promotions')
const { getStock } = await import('@/lib/api/stock')
const { clearVisit, getVisit, setVisit } = await import('@/lib/visit/cookie')
const { DELETE, POST } = await import('./route')

const mocked = {
  getAllProducts: vi.mocked(getAllProducts),
  getPromotion: vi.mocked(getPromotion),
  getStock: vi.mocked(getStock),
  getVisit: vi.mocked(getVisit),
  setVisit: vi.mocked(setVisit),
  clearVisit: vi.mocked(clearVisit),
}

const promotion = { id: 'promo_002', code: 'AUTO' } as Promotion

const products = (...ids: string[]) => ids.map((id) => ({ id }) as Product)
const stockOf = (count: number) => ({ stock: count }) as StockInfo

/** A request as the browser sends it: no body, or a JSON hand-back. */
const post = (body?: unknown, type = 'application/json') =>
  new Request('https://store.example/api/visit', {
    method: 'POST',
    ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { 'content-type': type } }),
  })

/** The visit the handler wrote, which is what the next request will read. */
const written = (): Visit => mocked.setVisit.mock.calls.at(-1)?.[0] as Visit

beforeEach(() => {
  vi.clearAllMocks()
  mocked.getVisit.mockResolvedValue(null)
  mocked.setVisit.mockResolvedValue([])
  mocked.getPromotion.mockResolvedValue(promotion)
  mocked.getAllProducts.mockResolvedValue(products('bottle_001', 'pin_001'))
  mocked.getStock.mockImplementation(async (id: string) =>
    stockOf(id === 'pin_001' ? 0 : 14),
  )
})

describe('POST /api/visit', () => {
  it('draws every product once and pins a promotion', async () => {
    const body = await (await POST(post())).json()

    expect(body).toEqual({ stock: { bottle_001: 14, pin_001: 0 }, promotion })
    expect(mocked.getStock).toHaveBeenCalledTimes(2)
    expect(written().stock).toEqual({ bottle_001: 14, pin_001: 0 })
  })

  it('leaves a failed draw out, and a later call fills it in', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked.getStock.mockImplementation(async (id: string) => {
      if (id === 'pin_001') throw new Error('the API is down')
      return stockOf(14)
    })

    const first = await (await POST(post())).json()
    expect(first.stock).toEqual({ bottle_001: 14 })

    mocked.getVisit.mockResolvedValue({ v: 1, drawnAt: 1, stock: { bottle_001: 14 }, promotion })
    mocked.getStock.mockResolvedValue(stockOf(3))
    const second = await (await POST(post())).json()

    expect(second.stock).toEqual({ bottle_001: 14, pin_001: 3 })
    expect(mocked.getStock).toHaveBeenLastCalledWith('pin_001')
  })

  it('keeps the counts and the promotion it already has, and tops up a new product', async () => {
    mocked.getVisit.mockResolvedValue({
      v: 1,
      drawnAt: 1,
      stock: { bottle_001: 14 },
      promotion,
    })
    mocked.getAllProducts.mockResolvedValue(products('bottle_001', 'pin_001'))
    mocked.getStock.mockResolvedValue(stockOf(9))

    const body = await (await POST(post())).json()

    expect(body.stock).toEqual({ bottle_001: 14, pin_001: 9 })
    expect(mocked.getStock).toHaveBeenCalledTimes(1)
    expect(mocked.getPromotion).not.toHaveBeenCalled()
  })

  it('keeps the drawn-at of the visit it is topping up, so the day does not restart', async () => {
    mocked.getVisit.mockResolvedValue({ v: 1, drawnAt: 42, stock: {}, promotion })
    await POST(post())
    expect(written().drawnAt).toBe(42)
  })

  it('leaves the rest of the visit intact when the promotion cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked.getPromotion.mockRejectedValue(new Error('the API is down'))

    const body = await (await POST(post())).json()

    expect(body.promotion).toBeNull()
    expect(body.stock).toEqual({ bottle_001: 14, pin_001: 0 })
  })

  it('never answers with a count the cookie had no room for', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    mocked.setVisit.mockResolvedValue(['pin_001'])

    const body = await (await POST(post())).json()

    expect(body.stock).toEqual({ bottle_001: 14 })
  })

  it('clamps a count the cookie schema would reject', async () => {
    mocked.getStock.mockResolvedValue(stockOf(5000))
    await POST(post())
    expect(written().stock.bottle_001).toBe(99)
  })
})

describe('POST /api/visit with a hand-back', () => {
  const shown = {
    id: 'promo_003',
    title: 'Shown',
    description: 'What the first render showed.',
    discountPercent: 10,
    code: 'SHOWN',
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2026-12-31T00:00:00Z',
    active: true,
  } satisfies Promotion

  it('keeps the draw and the promotion the first render showed', async () => {
    const body = await (
      await POST(post({ draw: { productId: 'bottle_001', count: 3 }, promotion: shown }))
    ).json()

    expect(body).toEqual({ stock: { bottle_001: 3, pin_001: 0 }, promotion: shown })
    expect(mocked.getStock).toHaveBeenCalledTimes(1)
    expect(mocked.getStock).toHaveBeenCalledWith('pin_001')
    expect(mocked.getPromotion).not.toHaveBeenCalled()
  })

  it('lets the visit win over a hand-back', async () => {
    mocked.getVisit.mockResolvedValue({
      v: 1,
      drawnAt: 1_700_000_000,
      stock: { bottle_001: 14, pin_001: 0 },
      promotion,
    })
    await POST(post({ draw: { productId: 'bottle_001', count: 29 }, promotion: shown }))

    expect(written().stock.bottle_001).toBe(14)
    expect(written().promotion).toEqual(promotion)
  })

  it.each([
    ['a count above the cart maximum', { productId: 'bottle_001', count: 5000 }],
    ['a fraction', { productId: 'bottle_001', count: 2.5 }],
    ['a negative count', { productId: 'bottle_001', count: -1 }],
    ['a product the catalogue does not list', { productId: 'ghost_001', count: 3 }],
    ['a draw of the wrong shape', 'bottle_001'],
  ])('drops %s and draws fresh', async (_label, draw) => {
    await POST(post({ draw }))

    expect(written().stock).toEqual({ bottle_001: 14, pin_001: 0 })
  })

  it.each([
    ['one that does not parse', { code: 'FAKE' }],
    ['an inactive one', { ...shown, active: false }],
    ['one too large for the cookie', { ...shown, description: 'x'.repeat(2000) }],
  ])('drops a promotion: %s', async (_label, handed) => {
    await POST(post({ promotion: handed }))

    expect(written().promotion).toEqual(promotion)
  })

  it('reads no body from a request that is not JSON', async () => {
    await POST(post({ draw: { productId: 'bottle_001', count: 3 } }, 'text/plain'))

    expect(written().stock.bottle_001).toBe(14)
  })

  it('opens a visit from a body that is not valid JSON', async () => {
    const request = new Request('https://store.example/api/visit', {
      method: 'POST',
      body: '{',
      headers: { 'content-type': 'application/json' },
    })
    expect((await POST(request)).status).toBe(200)
    expect(written().stock).toEqual({ bottle_001: 14, pin_001: 0 })
  })
})

describe('DELETE /api/visit', () => {
  it('drops the visit', async () => {
    const response = await DELETE()
    expect(await response.json()).toEqual({ ok: true })
    expect(mocked.clearVisit).toHaveBeenCalledTimes(1)
  })
})
