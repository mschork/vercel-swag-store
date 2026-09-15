import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/lib/api/cart'
import { ApiError } from '@/lib/api/client'
import type { Cart } from '@/lib/api/types'
import { CART_COOKIE } from './cookie'
import { getCartFromCookie, loadCart } from './get-cart'

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
vi.mock('@/lib/api/cart', () => ({ getCart: vi.fn() }))

const getCart = vi.mocked(api.getCart)

const cart: Cart = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  currency: 'USD',
  createdAt: '2026-09-15T00:00:00Z',
  updatedAt: '2026-09-15T00:00:00Z',
}

beforeEach(() => {
  jar.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getCartFromCookie', () => {
  it('returns null without calling the API when there is no cookie', async () => {
    await expect(getCartFromCookie()).resolves.toBeNull()
    expect(getCart).not.toHaveBeenCalled()
  })

  it('reads the cart for the cookie token', async () => {
    jar.set(CART_COOKIE, 'abc')
    getCart.mockResolvedValue(cart)
    await expect(getCartFromCookie()).resolves.toBe(cart)
    expect(getCart).toHaveBeenCalledWith('abc')
  })

  it('returns null for an expired cart and leaves the cookie alone', async () => {
    jar.set(CART_COOKIE, 'expired')
    getCart.mockResolvedValue(null)
    await expect(getCartFromCookie()).resolves.toBeNull()
    expect(jar.get(CART_COOKIE)).toBe('expired')
  })

  it('throws any other failure', async () => {
    jar.set(CART_COOKIE, 'abc')
    getCart.mockRejectedValue(new ApiError(0, 'TIMEOUT', 'timed out', '/cart'))
    await expect(getCartFromCookie()).rejects.toBeInstanceOf(ApiError)
  })
})

describe('loadCart', () => {
  it('wraps a cart, or no cart, so it differs from a failure', async () => {
    await expect(loadCart('Cart')).resolves.toEqual({ cart: null })
    jar.set(CART_COOKIE, 'abc')
    getCart.mockResolvedValue(cart)
    await expect(loadCart('Cart')).resolves.toEqual({ cart })
  })

  it('returns null and logs when the cart call fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    jar.set(CART_COOKIE, 'abc')
    getCart.mockRejectedValue(new ApiError(0, 'TIMEOUT', 'timed out', '/cart'))
    await expect(loadCart('Cart badge')).resolves.toBeNull()
    expect(error).toHaveBeenCalledTimes(1)
  })
})
