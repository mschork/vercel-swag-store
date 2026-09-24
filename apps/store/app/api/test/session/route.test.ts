import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Cart, Promotion } from '@/lib/api/types'
import { isSessionId, SESSION_MAX_AGE_SECONDS } from '@/lib/session/id'
import { product } from '@/test/helpers'

const { jar, cookies } = vi.hoisted(() => {
  const jar = new Map<string, string>()
  const cookies = vi.fn(async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
  }))
  return { jar, cookies }
})
vi.mock('next/headers', () => ({ cookies }))
// `connection()` throws outside a request, and a test has none.
vi.mock('next/server', async (original) => ({
  ...(await original<typeof import('next/server')>()),
  connection: async () => undefined,
}))
vi.mock('@/lib/api/cart', () => ({ createCart: vi.fn(), addCartItem: vi.fn() }))

type Route = typeof import('./route')

/** The route, the store and the cart API it uses, read with `E2E_SEED=flag`. */
async function load(flag: string) {
  vi.resetModules()
  vi.stubEnv('E2E_SEED', flag)
  return {
    route: await import('./route'),
    store: (await import('@/lib/session/store')).sessionStore,
    api: vi.mocked(await import('@/lib/api/cart')),
  }
}

const promotion: Promotion = {
  id: 'promo_seed',
  title: 'Free Stickers',
  description: 'Every order ships with stickers.',
  discountPercent: 0,
  code: 'AUTO',
  validFrom: '2026-01-01',
  validUntil: '2026-12-31',
  active: true,
}

function cart(quantity: number): Cart {
  const items =
    quantity === 0
      ? []
      : [
          {
            productId: 'tshirt_001',
            quantity,
            addedAt: '2026-09-22T00:00:00Z',
            product: product(),
            lineTotal: 3000 * quantity,
          },
        ]
  return {
    items,
    totalItems: quantity,
    subtotal: 3000 * quantity,
    currency: 'USD',
    createdAt: '2026-09-22T00:00:00Z',
    updatedAt: '2026-09-22T00:00:00Z',
  }
}

const post = (route: Route, body: unknown) =>
  route.POST(
    new Request('http://localhost/api/test/session', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )

let sid = ''
let counter = 0

beforeEach(() => {
  counter += 1
  sid = `00000000-0000-4000-a000-${String(counter).padStart(12, '0')}`
  jar.clear()
  jar.set('sid', sid)
  cookies.mockClear()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('/api/test/session without E2E_SEED', () => {
  it('answers 404 to every method and reads neither the cookie nor the store', async () => {
    const { route, store, api } = await load('')
    const spies = (['read', 'clearVisit', 'setStock', 'claimPromotion', 'setCart'] as const).map(
      (name) => vi.spyOn(store, name),
    )
    const responses = [
      await route.GET(),
      await post(route, { stock: { tshirt_001: 3 }, cart: [{ productId: 'tshirt_001', quantity: 1 }] }),
      await route.PUT(),
      await route.PATCH(),
      await route.DELETE(),
      await route.OPTIONS(),
    ]
    expect(responses.map((response) => response.status)).toEqual([404, 404, 404, 404, 404, 404])
    expect(responses.some((response) => response.headers.has('set-cookie'))).toBe(false)
    expect(cookies).not.toHaveBeenCalled()
    for (const spy of spies) expect(spy).not.toHaveBeenCalled()
    expect(api.createCart).not.toHaveBeenCalled()
  })
})

describe('/api/test/session with E2E_SEED=1', () => {
  it('replaces the visit with the seed, and GET reads back exactly that', async () => {
    const { route, store } = await load('1')
    await store.claimStock(sid, { tshirt_001: 7, cap_001: 2 })
    await store.claimPromotion(sid, null)

    const seeded = await post(route, { stock: { tshirt_001: 3 }, promotion })
    expect(seeded.status).toBe(200)
    const kept = { stock: { tshirt_001: 3 }, promotion }
    await expect(seeded.json()).resolves.toEqual(kept)
    await expect((await route.GET()).json()).resolves.toEqual(kept)
  })

  it('pins no promotion when the body says null', async () => {
    const { route } = await load('1')
    await post(route, { stock: {}, promotion: null })
    await expect((await route.GET()).json()).resolves.toEqual({ stock: {}, promotion: null })
  })

  it('answers null for a session without a visit, and for a caller without a session', async () => {
    const { route } = await load('1')
    await expect((await route.GET()).json()).resolves.toBeNull()
    jar.clear()
    await expect((await route.GET()).json()).resolves.toBeNull()
  })

  it('refuses a body that fails validation with 400 and keeps nothing', async () => {
    const { route, store } = await load('1')
    const clearVisit = vi.spyOn(store, 'clearVisit')
    for (const body of [
      'not json',
      { stock: { tshirt_001: -1 } },
      { stock: { tshirt_001: 1.5 } },
      { promotion: { id: 'half' } },
      { cart: [] },
      { stok: { tshirt_001: 3 } },
    ]) {
      expect((await post(route, body)).status, JSON.stringify(body)).toBe(400)
    }
    expect(clearVisit).not.toHaveBeenCalled()
  })

  it('mints a session cookie for a caller without one and keeps the seed under it', async () => {
    const { route, store } = await load('1')
    jar.clear()
    const response = await post(route, { stock: { tshirt_001: 4 } })
    const cookie = response.headers.get('set-cookie') ?? ''
    const minted = /^sid=([^;]+)/.exec(cookie)?.[1]
    expect(isSessionId(minted)).toBe(true)
    expect(cookie).toMatch(/; HttpOnly/i)
    expect(cookie).toMatch(/; SameSite=lax/i)
    expect(cookie).toMatch(/; Path=\//)
    expect(cookie).toContain(`Max-Age=${SESSION_MAX_AGE_SECONDS}`)
    expect(await store.read(minted ?? '')).toMatchObject({ visit: { stock: { tshirt_001: 4 } } })
  })

  it('sets no cookie for a caller that has a session', async () => {
    const { route } = await load('1')
    expect((await post(route, { stock: {} })).headers.has('set-cookie')).toBe(false)
  })

  it('opens an API cart with the items and makes it the mirror, and never answers the token', async () => {
    const { route, store, api } = await load('1')
    api.createCart.mockResolvedValue({ cart: cart(0), token: 'cart-token' })
    api.addCartItem.mockResolvedValue(cart(2))

    const response = await post(route, { cart: [{ productId: 'tshirt_001', quantity: 2 }] })
    expect(response.status).toBe(200)
    expect(await response.text()).not.toContain('cart-token')
    expect(api.addCartItem).toHaveBeenCalledWith('cart-token', 'tshirt_001', 2)
    expect(await store.read(sid)).toMatchObject({
      visit: null,
      cart: {
        token: 'cart-token',
        totalItems: 2,
        lines: [{ productId: 'tshirt_001', quantity: 2, price: 3000 }],
      },
    })
  })

  it('answers 405 to any other method', async () => {
    const { route } = await load('1')
    expect((await route.DELETE()).status).toBe(405)
  })
})
