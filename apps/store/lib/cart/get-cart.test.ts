import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sessionStore } from '@/lib/session/store'
import { loadCart } from './get-cart'

const { jar } = vi.hoisted(() => ({ jar: new Map<string, string>() }))

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    set: () => {
      throw new Error('A render must never set cookies')
    },
    delete: () => {
      throw new Error('A render must never clear cookies')
    },
  }),
}))

let sid = ''

const line = {
  productId: 'mug_001',
  slug: 'mug',
  name: 'Mug',
  image: null,
  price: 1200,
  quantity: 2,
}

beforeEach(() => {
  sid = crypto.randomUUID()
  jar.clear()
  jar.set('sid', sid)
  vi.stubGlobal('fetch', vi.fn(() => {
    throw new Error('loadCart must never call the API')
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('loadCart', () => {
  it('answers null for a session without a cart mirror', async () => {
    await expect(loadCart()).resolves.toBeNull()
  })

  it('answers the mirror without its token', async () => {
    await sessionStore.setCart(sid, {
      token: 'secret-token',
      currency: 'USD',
      lines: [line],
      totalItems: 2,
    })

    const cart = await loadCart()
    expect(cart).toEqual({ currency: 'USD', lines: [line], totalItems: 2 })
    expect(JSON.stringify(cart)).not.toContain('secret-token')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('answers unavailable for a request without a session id', async () => {
    jar.clear()
    await expect(loadCart()).resolves.toBe('unavailable')
  })

  it('answers unavailable when the store does not answer', async () => {
    vi.spyOn(sessionStore, 'read').mockResolvedValue('unavailable')
    await expect(loadCart()).resolves.toBe('unavailable')
  })
})
