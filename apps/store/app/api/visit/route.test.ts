import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Product, StockInfo } from '@/lib/api/types'

const { jar } = vi.hoisted(() => ({ jar: new Map<string, string>() }))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
  }),
}))
vi.mock('@/lib/api/products', () => ({ getAllProducts: vi.fn() }))
vi.mock('@/lib/api/stock', () => ({ getStock: vi.fn() }))

const { getAllProducts } = await import('@/lib/api/products')
const { getStock } = await import('@/lib/api/stock')
const { SESSION_COOKIE } = await import('@/lib/session/id')
const { sessionStore } = await import('@/lib/session/store')
const { DELETE } = await import('./route')

const mocked = {
  getAllProducts: vi.mocked(getAllProducts),
  getStock: vi.mocked(getStock),
}

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
  mocked.getStock.mockImplementation(async (id: string) => stockOf(id === 'pin_001' ? 0 : 14))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DELETE /api/visit', () => {
  it('clears the old draws and answers fresh ones, which the store keeps', async () => {
    await sessionStore.claimStock(sid, { bottle_001: 3, pin_001: 5 })

    const response = await DELETE()

    const fresh = { stock: { bottle_001: 14, pin_001: 0 } }
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
