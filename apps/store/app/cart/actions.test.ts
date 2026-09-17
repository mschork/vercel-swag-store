import { refresh } from 'next/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/lib/api/cart'
import { ApiError } from '@/lib/api/client'
import type { Cart } from '@/lib/api/types'
import { CART_COOKIE, CART_COOKIE_MAX_AGE } from '@/lib/cart/cookie'
import { product } from '@/test/helpers'
import {
  addToCart,
  placeOrder,
  removeItem,
  updateQuantity,
} from './actions'

const { jar, cookieStore } = vi.hoisted(() => {
  const jar = new Map<string, string>()
  const cookieStore = {
    get: vi.fn((name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    ),
    set: vi.fn((name: string, value: string) => {
      jar.set(name, value)
    }),
    delete: vi.fn((cookie: string | { name: string }) => {
      jar.delete(typeof cookie === 'string' ? cookie : cookie.name)
    }),
  }
  return { jar, cookieStore }
})

vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))
vi.mock('@/lib/api/cart', () => ({
  createCart: vi.fn(),
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
}))

const mocked = vi.mocked(api)

const EXPIRED = 'Your cart expired. Add products again to start a new cart.'
const NOT_IN_CART = 'This item is no longer in your cart.'

function cart(quantity = 1): Cart {
  const items =
    quantity === 0
      ? []
      : [
          {
            productId: 'tshirt_001',
            quantity,
            addedAt: '2026-09-15T00:00:00Z',
            product: product(),
            lineTotal: 3000 * quantity,
          },
        ]
  return {
    items,
    totalItems: quantity,
    subtotal: 3000 * quantity,
    currency: 'USD',
    createdAt: '2026-09-15T00:00:00Z',
    updatedAt: '2026-09-15T00:00:00Z',
  }
}

function form(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.set(key, value)
  return data
}

const notFound = (message: string) =>
  new ApiError(404, 'NOT_FOUND', message, '/cart')

/** The target of the redirect `run` throws, read from Next's redirect digest. */
async function redirectTarget(run: () => Promise<unknown>): Promise<string> {
  try {
    await run()
  } catch (error) {
    const digest = (error as { digest?: unknown }).digest
    if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) {
      return digest.split(';')[2] ?? ''
    }
    throw error
  }
  throw new Error('Expected a redirect')
}

function expectCookieSlid(token: string) {
  expect(cookieStore.set).toHaveBeenCalledWith(
    CART_COOKIE,
    token,
    expect.objectContaining({
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: CART_COOKIE_MAX_AGE,
    }),
  )
}

beforeEach(() => {
  jar.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('addToCart', () => {
  it.each(['0', '-1', '1.5', 'abc', ''])(
    'rejects quantity %j without calling the API',
    async (quantity) => {
      await expect(
        addToCart(null, form({ productId: 'tshirt_001', quantity })),
      ).resolves.toEqual({
        ok: false,
        error: 'Choose a whole quantity of at least 1.',
      })
      expect(mocked.addCartItem).not.toHaveBeenCalled()
    },
  )

  it.each<Record<string, string>>([{}, { productId: '  ' }])(
    'rejects a missing product id (%j)',
    async (entries) => {
      await expect(
        addToCart(null, form({ ...entries, quantity: '1' })),
      ).resolves.toEqual({ ok: false, error: 'This item could not be added.' })
      expect(mocked.createCart).not.toHaveBeenCalled()
    },
  )

  it('creates a cart, sets the cookie and answers with the count on the first add', async () => {
    mocked.createCart.mockResolvedValue({ cart: cart(0), token: 'new-token' })
    mocked.addCartItem.mockResolvedValue(cart(2))

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '2' })),
    ).resolves.toEqual({ ok: true, totalItems: 2 })

    expect(mocked.getCart).not.toHaveBeenCalled()
    expect(mocked.addCartItem).toHaveBeenCalledWith('new-token', 'tshirt_001', 2)
    expect(jar.get(CART_COOKIE)).toBe('new-token')
    expectCookieSlid('new-token')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('adds to the live cart with one write and slides the cookie', async () => {
    jar.set(CART_COOKIE, 'live')
    mocked.addCartItem.mockResolvedValue(cart(2))

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '1' })),
    ).resolves.toEqual({ ok: true, totalItems: 2 })

    expect(mocked.getCart).not.toHaveBeenCalled()
    expect(mocked.createCart).not.toHaveBeenCalled()
    expect(mocked.addCartItem).toHaveBeenCalledTimes(1)
    expect(mocked.addCartItem).toHaveBeenCalledWith('live', 'tshirt_001', 1)
    expectCookieSlid('live')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('replaces an expired cart after the write 404s and retries once', async () => {
    jar.set(CART_COOKIE, 'expired')
    mocked.addCartItem
      .mockRejectedValueOnce(notFound('Cart not found'))
      .mockResolvedValueOnce(cart(1))
    mocked.getCart.mockResolvedValue(null)
    mocked.createCart.mockResolvedValue({ cart: cart(0), token: 'fresh' })

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '1' })),
    ).resolves.toEqual({ ok: true, totalItems: 1 })

    expect(mocked.addCartItem.mock.calls).toEqual([
      ['expired', 'tshirt_001', 1],
      ['fresh', 'tshirt_001', 1],
    ])
    expect(mocked.getCart).toHaveBeenCalledExactlyOnceWith('expired')
    expect(jar.get(CART_COOKIE)).toBe('fresh')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('never retries twice: a 404 in the new cart reports the product', async () => {
    jar.set(CART_COOKIE, 'expired')
    mocked.addCartItem.mockRejectedValue(notFound('Product not found'))
    mocked.getCart.mockImplementation(async (token) =>
      token === 'fresh' ? cart(0) : null,
    )
    mocked.createCart.mockResolvedValue({ cart: cart(0), token: 'fresh' })

    await expect(
      addToCart(null, form({ productId: 'gone_001', quantity: '1' })),
    ).resolves.toEqual({
      ok: false,
      error: 'This product is no longer available.',
      totalItems: 0,
    })

    expect(mocked.addCartItem).toHaveBeenCalledTimes(2)
    expect(mocked.createCart).toHaveBeenCalledTimes(1)
    expect(jar.get(CART_COOKIE)).toBe('fresh')
  })

  it('answers with retry copy when the cart expired and no new one can be opened', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    jar.set(CART_COOKIE, 'expired')
    mocked.addCartItem.mockRejectedValue(notFound('Cart not found'))
    mocked.getCart.mockResolvedValue(null)
    mocked.createCart.mockRejectedValue(
      new ApiError(0, 'TIMEOUT', 'timed out', '/cart/create'),
    )

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '1' })),
    ).resolves.toEqual({
      ok: false,
      error: 'This item could not be added. Try again.',
    })
    expect(mocked.addCartItem).toHaveBeenCalledTimes(1)
    expect(jar.get(CART_COOKIE)).toBe('expired')
  })

  it('reports an unknown product and keeps the cookie when the cart still exists', async () => {
    jar.set(CART_COOKIE, 'live')
    mocked.getCart.mockResolvedValue(cart(1))
    mocked.addCartItem.mockRejectedValue(notFound('Product not found'))

    await expect(
      addToCart(null, form({ productId: 'gone_001', quantity: '1' })),
    ).resolves.toEqual({
      ok: false,
      error: 'This product is no longer available.',
      totalItems: 1,
    })

    expect(jar.get(CART_COOKIE)).toBe('live')
    expect(cookieStore.delete).not.toHaveBeenCalled()
    expect(cookieStore.set).not.toHaveBeenCalled()
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('answers with retry copy when the API fails, without refreshing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    jar.set(CART_COOKIE, 'live')
    mocked.getCart.mockResolvedValue(cart(1))
    mocked.addCartItem.mockRejectedValue(
      new ApiError(503, 'HTTP_ERROR', 'Service Unavailable', '/cart'),
    )

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '1' })),
    ).resolves.toEqual({
      ok: false,
      error: 'This item could not be added. Try again.',
    })
    expect(refresh).not.toHaveBeenCalled()
  })

  it('answers with retry copy when no cart can be opened', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked.createCart.mockRejectedValue(
      new ApiError(0, 'TIMEOUT', 'timed out', '/cart/create'),
    )

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '1' })),
    ).resolves.toEqual({
      ok: false,
      error: 'This item could not be added. Try again.',
    })
    expect(mocked.addCartItem).not.toHaveBeenCalled()
    expect(jar.has(CART_COOKIE)).toBe(false)
  })
})

describe('updateQuantity', () => {
  it.each([-1, 100, 1.5, Number.NaN])(
    'rejects quantity %j without calling the API',
    async (quantity) => {
      jar.set(CART_COOKIE, 'live')
      await expect(updateQuantity('tshirt_001', quantity)).resolves.toEqual({
        ok: false,
        error: 'Choose a whole quantity from 1 to 99.',
      })
      expect(mocked.updateCartItem).not.toHaveBeenCalled()
    },
  )

  it('rejects an empty or non-string product id', async () => {
    const bad = 42 as unknown as string
    for (const productId of ['', '   ', bad]) {
      await expect(updateQuantity(productId, 1)).resolves.toEqual({
        ok: false,
        error: 'This item could not be updated.',
      })
    }
    expect(mocked.updateCartItem).not.toHaveBeenCalled()
  })

  it.each([0, 99])('accepts quantity %i', async (quantity) => {
    jar.set(CART_COOKIE, 'live')
    mocked.updateCartItem.mockResolvedValue(cart(quantity))
    await expect(updateQuantity('tshirt_001', quantity)).resolves.toEqual({
      ok: true,
      totalItems: quantity,
    })
    expect(mocked.updateCartItem).toHaveBeenCalledWith(
      'live',
      'tshirt_001',
      quantity,
    )
  })

  it('slides the cookie and refreshes after a successful write', async () => {
    jar.set(CART_COOKIE, 'live')
    mocked.updateCartItem.mockResolvedValue(cart(2))

    await expect(updateQuantity('tshirt_001', 2)).resolves.toEqual({ ok: true, totalItems: 2 })

    expectCookieSlid('live')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('treats a missing cookie as an expired cart', async () => {
    await expect(updateQuantity('tshirt_001', 2)).resolves.toEqual({
      ok: false,
      error: EXPIRED,
      totalItems: 0,
    })
    expect(mocked.updateCartItem).not.toHaveBeenCalled()
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('keeps the cookie when a 404 turns out to be a missing line', async () => {
    jar.set(CART_COOKIE, 'live')
    mocked.updateCartItem.mockRejectedValue(notFound('Cart item not found'))
    mocked.getCart.mockResolvedValue(cart(0))

    await expect(updateQuantity('tshirt_001', 2)).resolves.toEqual({
      ok: false,
      error: NOT_IN_CART,
      totalItems: 0,
    })

    expect(mocked.getCart).toHaveBeenCalledTimes(1)
    expect(mocked.getCart).toHaveBeenCalledWith('live')
    expect(jar.get(CART_COOKIE)).toBe('live')
    expect(cookieStore.delete).not.toHaveBeenCalled()
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('clears the cookie when a 404 turns out to be an expired cart', async () => {
    jar.set(CART_COOKIE, 'expired')
    mocked.updateCartItem.mockRejectedValue(notFound('Cart not found'))
    mocked.getCart.mockResolvedValue(null)

    await expect(updateQuantity('tshirt_001', 2)).resolves.toEqual({
      ok: false,
      error: EXPIRED,
      totalItems: 0,
    })

    expect(jar.has(CART_COOKIE)).toBe(false)
    expect(cookieStore.delete).toHaveBeenCalledWith({
      name: CART_COOKIE,
      path: '/',
    })
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('keeps the cookie when the re-check after a 404 fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    jar.set(CART_COOKIE, 'live')
    mocked.updateCartItem.mockRejectedValue(notFound('Cart item not found'))
    mocked.getCart.mockRejectedValue(
      new ApiError(0, 'NETWORK_ERROR', 'down', '/cart'),
    )

    await expect(updateQuantity('tshirt_001', 2)).resolves.toEqual({
      ok: false,
      error: 'The quantity could not be changed. Try again.',
    })
    expect(jar.get(CART_COOKIE)).toBe('live')
    expect(refresh).not.toHaveBeenCalled()
  })

  it('keeps the cart as it is when the API fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    jar.set(CART_COOKIE, 'live')
    mocked.updateCartItem.mockRejectedValue(
      new ApiError(422, 'VALIDATION_ERROR', 'bad', '/cart/tshirt_001'),
    )

    await expect(updateQuantity('tshirt_001', 2)).resolves.toEqual({
      ok: false,
      error: 'The quantity could not be changed. Try again.',
    })
    expect(mocked.getCart).not.toHaveBeenCalled()
    expect(cookieStore.set).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
  })
})

describe('removeItem', () => {
  it('rejects an empty or non-string product id', async () => {
    const bad = { id: 'tshirt_001' } as unknown as string
    for (const productId of ['', bad]) {
      await expect(removeItem(productId)).resolves.toEqual({
        ok: false,
        error: 'This item could not be removed.',
      })
    }
    expect(mocked.removeCartItem).not.toHaveBeenCalled()
  })

  it('removes the line, slides the cookie and refreshes', async () => {
    jar.set(CART_COOKIE, 'live')
    mocked.removeCartItem.mockResolvedValue(cart(0))

    await expect(removeItem('tshirt_001')).resolves.toEqual({ ok: true, totalItems: 0 })

    expect(mocked.removeCartItem).toHaveBeenCalledWith('live', 'tshirt_001')
    expectCookieSlid('live')
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('keeps the cookie for a missing line and clears it for a missing cart', async () => {
    jar.set(CART_COOKIE, 'live')
    mocked.removeCartItem.mockRejectedValue(notFound('Cart item not found'))
    mocked.getCart.mockResolvedValueOnce(cart(1))
    await expect(removeItem('tshirt_001')).resolves.toEqual({
      ok: false,
      error: NOT_IN_CART,
      totalItems: 1,
    })
    expect(jar.get(CART_COOKIE)).toBe('live')

    mocked.getCart.mockResolvedValueOnce(null)
    await expect(removeItem('tshirt_001')).resolves.toEqual({
      ok: false,
      error: EXPIRED,
      totalItems: 0,
    })
    expect(jar.has(CART_COOKIE)).toBe(false)
  })

  it('answers with retry copy when the API fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    jar.set(CART_COOKIE, 'live')
    mocked.removeCartItem.mockRejectedValue(
      new ApiError(0, 'TIMEOUT', 'timed out', '/cart/tshirt_001'),
    )
    await expect(removeItem('tshirt_001')).resolves.toEqual({
      ok: false,
      error: 'This item could not be removed. Try again.',
    })
    expect(refresh).not.toHaveBeenCalled()
  })
})

describe('placeOrder', () => {
  it('sends a visitor without a cart cookie back to the cart', async () => {
    await expect(redirectTarget(placeOrder)).resolves.toBe('/cart')
    expect(mocked.getCart).not.toHaveBeenCalled()
  })

  it('sends an expired cart back to the cart', async () => {
    jar.set(CART_COOKIE, 'expired')
    mocked.getCart.mockResolvedValue(null)
    await expect(redirectTarget(placeOrder)).resolves.toBe('/cart')
  })

  it('sends an empty cart back to the cart and keeps its cookie', async () => {
    jar.set(CART_COOKIE, 'live')
    mocked.getCart.mockResolvedValue(cart(0))
    await expect(redirectTarget(placeOrder)).resolves.toBe('/cart')
    expect(jar.get(CART_COOKIE)).toBe('live')
  })

  it('sends the visitor back to the cart when it cannot be read', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    jar.set(CART_COOKIE, 'live')
    mocked.getCart.mockRejectedValue(
      new ApiError(0, 'NETWORK_ERROR', 'down', '/cart'),
    )
    await expect(redirectTarget(placeOrder)).resolves.toBe('/cart')
    expect(jar.get(CART_COOKIE)).toBe('live')
  })

  it('drops the cookie of a cart with lines and lands on the checkout page', async () => {
    jar.set(CART_COOKIE, 'live')
    mocked.getCart.mockResolvedValue(cart(2))

    await expect(redirectTarget(placeOrder)).resolves.toBe('/checkout')

    expect(jar.has(CART_COOKIE)).toBe(false)
    expect(mocked.removeCartItem).not.toHaveBeenCalled()
  })
})
