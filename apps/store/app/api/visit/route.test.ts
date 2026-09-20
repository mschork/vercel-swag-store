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
    const body = await (await POST()).json()

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

    const first = await (await POST()).json()
    expect(first.stock).toEqual({ bottle_001: 14 })

    mocked.getVisit.mockResolvedValue({ v: 1, drawnAt: 1, stock: { bottle_001: 14 }, promotion })
    mocked.getStock.mockResolvedValue(stockOf(3))
    const second = await (await POST()).json()

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

    const body = await (await POST()).json()

    expect(body.stock).toEqual({ bottle_001: 14, pin_001: 9 })
    expect(mocked.getStock).toHaveBeenCalledTimes(1)
    expect(mocked.getPromotion).not.toHaveBeenCalled()
  })

  it('keeps the drawn-at of the visit it is topping up, so the day does not restart', async () => {
    mocked.getVisit.mockResolvedValue({ v: 1, drawnAt: 42, stock: {}, promotion })
    await POST()
    expect(written().drawnAt).toBe(42)
  })

  it('leaves the rest of the visit intact when the promotion cannot be loaded', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked.getPromotion.mockRejectedValue(new Error('the API is down'))

    const body = await (await POST()).json()

    expect(body.promotion).toBeNull()
    expect(body.stock).toEqual({ bottle_001: 14, pin_001: 0 })
  })

  it('never answers with a count the cookie had no room for', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    mocked.setVisit.mockResolvedValue(['pin_001'])

    const body = await (await POST()).json()

    expect(body.stock).toEqual({ bottle_001: 14 })
  })

  it('clamps a count the cookie schema would reject', async () => {
    mocked.getStock.mockResolvedValue(stockOf(5000))
    await POST()
    expect(written().stock.bottle_001).toBe(99)
  })
})

describe('DELETE /api/visit', () => {
  it('drops the visit', async () => {
    const response = await DELETE()
    expect(await response.json()).toEqual({ ok: true })
    expect(mocked.clearVisit).toHaveBeenCalledTimes(1)
  })
})
