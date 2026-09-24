import { refresh } from 'next/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/lib/api/cart'
import { ApiError } from '@/lib/api/client'
import type { Cart } from '@/lib/api/types'
import { toLines } from '@/lib/cart/lines'
import { sessionStore, type CartRecord } from '@/lib/session/store'
import * as draw from '@/lib/visit/draw'
import { product } from '@/test/helpers'
import {
  addToCart,
  placeOrder,
  prepareCart,
  removeItem,
  updateQuantity,
} from './actions'

const { session, cookieStore } = vi.hoisted(() => {
  const session = { id: undefined as string | undefined }
  const cookieStore = {
    get: vi.fn((name: string) =>
      name === 'sid' && session.id ? { name, value: session.id } : undefined,
    ),
    set: vi.fn(() => {
      throw new Error('An action must never set a cookie')
    }),
    delete: vi.fn(() => {
      throw new Error('An action must never clear a cookie')
    }),
  }
  return { session, cookieStore }
})

vi.mock('next/headers', () => ({ cookies: async () => cookieStore }))
vi.mock('@/lib/api/cart', () => ({
  createCart: vi.fn(),
  getCart: vi.fn(),
  addCartItem: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn(),
}))
// The visit's own tests cover drawing; here a draw is whatever a test says.
vi.mock('@/lib/visit/draw', () => ({ drawFor: vi.fn(async () => null) }))

const mocked = vi.mocked(api)
const drawFor = vi.mocked(draw.drawFor)

const EXPIRED = 'Your cart expired. Add products again to start a new cart.'
const NOT_IN_CART = 'This item is no longer in your cart.'
const UNAVAILABLE = 'Your cart cannot be reached right now. Try again in a moment.'
const ADD_FAILED = 'This item could not be added. Try again.'
const GONE = 'This product is no longer available.'

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

const created = (token: string) => ({ cart: cart(0), token })

/** Keeps `from` as the session's cart mirror, as an earlier action would have. */
async function seedCart(token: string, from: Cart = cart(1)): Promise<CartRecord> {
  await sessionStore.setCart(session.id as string, {
    token,
    currency: from.currency,
    lines: toLines(from),
    totalItems: from.totalItems,
  })
  return (await mirror()) as CartRecord
}

async function mirror(): Promise<CartRecord | null> {
  const state = await sessionStore.read(session.id as string)
  if (state === 'unavailable') throw new Error('The memory store always answers')
  return state.cart
}

async function seedVisit(stock: Record<string, number>): Promise<void> {
  await sessionStore.claimStock(session.id as string, stock)
}

async function visitStock(): Promise<Record<string, number> | undefined> {
  const state = await sessionStore.read(session.id as string)
  if (state === 'unavailable') throw new Error('The memory store always answers')
  return state.visit?.stock
}

function form(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [key, value] of Object.entries(entries)) data.set(key, value)
  return data
}

const notFound = (message: string) =>
  new ApiError(404, 'NOT_FOUND', message, '/cart')

/** The target of the redirect `run` throws, from Next's redirect digest. */
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

function expectNoApiCall() {
  for (const call of Object.values(mocked)) expect(call).not.toHaveBeenCalled()
}

/**
 * An order refreshes once, so the layout drops the cart it ordered; cleared
 * here because every other test asserts that nothing refreshes.
 */
function expectOrderRefreshed(): void {
  expect(refresh).toHaveBeenCalledOnce()
  vi.mocked(refresh).mockClear()
}

beforeEach(() => {
  vi.resetAllMocks()
  session.id = crypto.randomUUID()
})

afterEach(() => {
  vi.restoreAllMocks()
  // The client applies the lines an action answers; only an order re-renders.
  expect(refresh).not.toHaveBeenCalled()
  expect(cookieStore.set).not.toHaveBeenCalled()
  expect(cookieStore.delete).not.toHaveBeenCalled()
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
      expectNoApiCall()
    },
  )

  it.each<Record<string, string>>([{}, { productId: '  ' }])(
    'rejects a missing product id (%j)',
    async (entries) => {
      await expect(
        addToCart(null, form({ ...entries, quantity: '1' })),
      ).resolves.toEqual({ ok: false, error: 'This item could not be added.' })
      expectNoApiCall()
    },
  )

  it('opens a cart, keeps it as the mirror and answers with the lines on the first add', async () => {
    let duringWrite: CartRecord | null = null
    mocked.createCart.mockResolvedValue(created('new-token'))
    mocked.addCartItem.mockImplementation(async () => {
      duringWrite = await mirror()
      return cart(2)
    })

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '2' })),
    ).resolves.toEqual({
      ok: true,
      totalItems: 2,
      line: { productId: 'tshirt_001', quantity: 2 },
      lines: toLines(cart(2)),
    })

    expect(duringWrite).toMatchObject({ token: 'new-token', lines: [], totalItems: 0 })
    expect(mocked.getCart).not.toHaveBeenCalled()
    expect(mocked.addCartItem).toHaveBeenCalledWith('new-token', 'tshirt_001', 2)
    expect(await mirror()).toMatchObject({
      token: 'new-token',
      currency: 'USD',
      lines: toLines(cart(2)),
      totalItems: 2,
    })
  })

  it('adds to the mirrored cart with one write and saves the answer', async () => {
    await seedCart('live', cart(1))
    mocked.addCartItem.mockResolvedValue(cart(2))

    const result = await addToCart(null, form({ productId: 'tshirt_001', quantity: '1' }))
    expect(result).toEqual({
      ok: true,
      totalItems: 2,
      line: { productId: 'tshirt_001', quantity: 2 },
      lines: toLines(cart(2)),
    })

    expect(mocked.getCart).not.toHaveBeenCalled()
    expect(mocked.createCart).not.toHaveBeenCalled()
    expect(mocked.addCartItem).toHaveBeenCalledExactlyOnceWith('live', 'tshirt_001', 1)
    expect(await mirror()).toMatchObject({ token: 'live', totalItems: 2 })
    expect(JSON.stringify(result)).not.toContain('live')
  })

  it('replaces an expired cart after the write 404s and retries once', async () => {
    await seedCart('expired')
    mocked.addCartItem
      .mockRejectedValueOnce(notFound('Cart not found'))
      .mockResolvedValueOnce(cart(1))
    mocked.getCart.mockResolvedValue(null)
    mocked.createCart.mockResolvedValue(created('fresh'))

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '1' })),
    ).resolves.toEqual({
      ok: true,
      totalItems: 1,
      line: { productId: 'tshirt_001', quantity: 1 },
      lines: toLines(cart(1)),
    })

    expect(mocked.addCartItem.mock.calls).toEqual([
      ['expired', 'tshirt_001', 1],
      ['fresh', 'tshirt_001', 1],
    ])
    expect(mocked.getCart).toHaveBeenCalledExactlyOnceWith('expired')
    expect(await mirror()).toMatchObject({ token: 'fresh', totalItems: 1 })
  })

  it('never retries twice: a 404 in the new cart reports the product', async () => {
    await seedCart('expired')
    mocked.addCartItem.mockRejectedValue(notFound('Product not found'))
    mocked.getCart.mockImplementation(async (token) =>
      token === 'fresh' ? cart(0) : null,
    )
    mocked.createCart.mockResolvedValue(created('fresh'))

    await expect(
      addToCart(null, form({ productId: 'gone_001', quantity: '1' })),
    ).resolves.toEqual({
      ok: false,
      error: GONE,
      totalItems: 0,
      line: { productId: 'gone_001', quantity: 0 },
      lines: [],
    })

    expect(mocked.addCartItem).toHaveBeenCalledTimes(2)
    expect(mocked.createCart).toHaveBeenCalledTimes(1)
    expect(await mirror()).toMatchObject({ token: 'fresh', lines: [] })
  })

  it('answers with retry copy and an empty cart when the cart expired and no new one opens', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await seedCart('expired')
    mocked.addCartItem.mockRejectedValue(notFound('Cart not found'))
    mocked.getCart.mockResolvedValue(null)
    mocked.createCart.mockRejectedValue(
      new ApiError(0, 'TIMEOUT', 'timed out', '/cart/create'),
    )

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '1' })),
    ).resolves.toEqual({ ok: false, error: ADD_FAILED, totalItems: 0, lines: [] })
    expect(mocked.addCartItem).toHaveBeenCalledTimes(1)
    expect(await mirror()).toBeNull()
  })

  it('reports an unknown product and saves the cart the re-check found', async () => {
    await seedCart('live', cart(0))
    mocked.getCart.mockResolvedValue(cart(1))
    mocked.addCartItem.mockRejectedValue(notFound('Product not found'))

    await expect(
      addToCart(null, form({ productId: 'gone_001', quantity: '1' })),
    ).resolves.toEqual({
      ok: false,
      error: GONE,
      totalItems: 1,
      line: { productId: 'gone_001', quantity: 0 },
      lines: toLines(cart(1)),
    })

    expect(await mirror()).toMatchObject({ token: 'live', totalItems: 1 })
  })

  it('answers with retry copy when the API fails and keeps the mirror', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const before = await seedCart('live')
    mocked.addCartItem.mockRejectedValue(
      new ApiError(503, 'HTTP_ERROR', 'Service Unavailable', '/cart'),
    )

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '1' })),
    ).resolves.toEqual({ ok: false, error: ADD_FAILED })
    expect(await mirror()).toEqual(before)
  })

  it('answers with retry copy when no cart can be opened', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked.createCart.mockRejectedValue(
      new ApiError(0, 'TIMEOUT', 'timed out', '/cart/create'),
    )

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '1' })),
    ).resolves.toEqual({ ok: false, error: ADD_FAILED })
    expect(mocked.addCartItem).not.toHaveBeenCalled()
    expect(await mirror()).toBeNull()
  })

  it('adds into the cart another action opened meanwhile, not a second one', async () => {
    mocked.createCart
      .mockResolvedValueOnce(created('first'))
      .mockResolvedValueOnce(created('second'))
    mocked.addCartItem.mockResolvedValue(cart(1))

    await Promise.all([
      prepareCart(),
      addToCart(null, form({ productId: 'tshirt_001', quantity: '1' })),
    ])

    const kept = await mirror()
    expect(mocked.createCart).toHaveBeenCalledTimes(2)
    expect(mocked.addCartItem).toHaveBeenCalledWith(kept?.token, 'tshirt_001', 1)
  })

  it('writes nothing into a new cart whose token the store cannot keep', async () => {
    vi.spyOn(sessionStore, 'claimCart').mockResolvedValue(null)
    mocked.createCart.mockResolvedValue(created('fresh'))

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '1' })),
    ).resolves.toEqual({ ok: false, error: ADD_FAILED })
    expect(mocked.addCartItem).not.toHaveBeenCalled()
  })
})

describe('updateQuantity', () => {
  it.each([-1, 100, 1.5, Number.NaN])(
    'rejects quantity %j without calling the API',
    async (quantity) => {
      await seedCart('live')
      await expect(updateQuantity('tshirt_001', quantity)).resolves.toEqual({
        ok: false,
        error: 'Choose a whole quantity from 1 to 99.',
      })
      expectNoApiCall()
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
    expectNoApiCall()
  })

  it.each([0, 99])('accepts quantity %i', async (quantity) => {
    await seedCart('live')
    mocked.updateCartItem.mockResolvedValue(cart(quantity))
    await expect(updateQuantity('tshirt_001', quantity)).resolves.toMatchObject({
      ok: true,
      totalItems: quantity,
      line: { productId: 'tshirt_001', quantity },
    })
    expect(mocked.updateCartItem).toHaveBeenCalledWith('live', 'tshirt_001', quantity)
  })

  it('answers with the saved lines and keeps them as the mirror', async () => {
    await seedCart('live', cart(1))
    mocked.updateCartItem.mockResolvedValue(cart(2))

    const result = await updateQuantity('tshirt_001', 2)
    expect(result).toEqual({
      ok: true,
      totalItems: 2,
      line: { productId: 'tshirt_001', quantity: 2 },
      lines: toLines(cart(2)),
    })
    expect(mocked.getCart).not.toHaveBeenCalled()
    expect(await mirror()).toMatchObject({ token: 'live', lines: toLines(cart(2)), totalItems: 2 })
    expect(JSON.stringify(result)).not.toContain('live')
  })

  it('treats a session without a cart mirror as an expired cart', async () => {
    await expect(updateQuantity('tshirt_001', 2)).resolves.toEqual({
      ok: false,
      error: EXPIRED,
      totalItems: 0,
      lines: [],
    })
    expectNoApiCall()
  })

  it('keeps the mirror when a 404 turns out to be a missing line', async () => {
    await seedCart('live')
    mocked.updateCartItem.mockRejectedValue(notFound('Cart item not found'))
    mocked.getCart.mockResolvedValue(cart(0))

    await expect(updateQuantity('tshirt_001', 2)).resolves.toEqual({
      ok: false,
      error: NOT_IN_CART,
      totalItems: 0,
      line: { productId: 'tshirt_001', quantity: 0 },
      lines: [],
    })

    expect(mocked.getCart).toHaveBeenCalledExactlyOnceWith('live')
    expect(await mirror()).toMatchObject({ token: 'live', lines: [], totalItems: 0 })
  })

  it('clears the mirror when a 404 turns out to be an expired cart', async () => {
    await seedCart('expired')
    mocked.updateCartItem.mockRejectedValue(notFound('Cart not found'))
    mocked.getCart.mockResolvedValue(null)

    await expect(updateQuantity('tshirt_001', 2)).resolves.toEqual({
      ok: false,
      error: EXPIRED,
      totalItems: 0,
      lines: [],
    })
    expect(await mirror()).toBeNull()
  })

  it('keeps the mirror when the re-check after a 404 fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const before = await seedCart('live')
    mocked.updateCartItem.mockRejectedValue(notFound('Cart item not found'))
    mocked.getCart.mockRejectedValue(new ApiError(0, 'NETWORK_ERROR', 'down', '/cart'))

    await expect(updateQuantity('tshirt_001', 2)).resolves.toEqual({
      ok: false,
      error: 'The quantity could not be changed. Try again.',
    })
    expect(await mirror()).toEqual(before)
  })

  it('keeps the mirror as it is when the API fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const before = await seedCart('live')
    mocked.updateCartItem.mockRejectedValue(
      new ApiError(422, 'VALIDATION_ERROR', 'bad', '/cart/tshirt_001'),
    )

    await expect(updateQuantity('tshirt_001', 2)).resolves.toEqual({
      ok: false,
      error: 'The quantity could not be changed. Try again.',
    })
    expect(mocked.getCart).not.toHaveBeenCalled()
    expect(await mirror()).toEqual(before)
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
    expectNoApiCall()
  })

  it('removes the line, answers with the lines that are left and keeps them', async () => {
    await seedCart('live')
    mocked.removeCartItem.mockResolvedValue(cart(0))

    await expect(removeItem('tshirt_001')).resolves.toEqual({
      ok: true,
      totalItems: 0,
      line: { productId: 'tshirt_001', quantity: 0 },
      lines: [],
    })

    expect(mocked.removeCartItem).toHaveBeenCalledWith('live', 'tshirt_001')
    expect(mocked.getCart).not.toHaveBeenCalled()
    expect(await mirror()).toMatchObject({ token: 'live', lines: [], totalItems: 0 })
  })

  it('keeps the mirror for a missing line and clears it for a missing cart', async () => {
    await seedCart('live')
    mocked.removeCartItem.mockRejectedValue(notFound('Cart item not found'))
    mocked.getCart.mockResolvedValueOnce(cart(1))
    await expect(removeItem('tshirt_001')).resolves.toEqual({
      ok: false,
      error: NOT_IN_CART,
      totalItems: 1,
      line: { productId: 'tshirt_001', quantity: 1 },
      lines: toLines(cart(1)),
    })
    expect(await mirror()).toMatchObject({ token: 'live' })

    mocked.getCart.mockResolvedValueOnce(null)
    await expect(removeItem('tshirt_001')).resolves.toEqual({
      ok: false,
      error: EXPIRED,
      totalItems: 0,
      lines: [],
    })
    expect(await mirror()).toBeNull()
  })

  it('answers with retry copy when the API fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await seedCart('live')
    mocked.removeCartItem.mockRejectedValue(
      new ApiError(0, 'TIMEOUT', 'timed out', '/cart/tshirt_001'),
    )
    await expect(removeItem('tshirt_001')).resolves.toEqual({
      ok: false,
      error: 'This item could not be removed. Try again.',
    })
  })
})

describe('an unavailable session', () => {
  const causes = {
    'no session id': () => {
      session.id = undefined
    },
    'a store that does not answer': () => {
      vi.spyOn(sessionStore, 'read').mockResolvedValue('unavailable')
    },
  }

  it.each(Object.entries(causes))(
    'makes every write say the cart cannot be reached, with %s',
    async (_cause, make) => {
      make()
      const add = await addToCart(null, form({ productId: 'tshirt_001', quantity: '1' }))
      const update = await updateQuantity('tshirt_001', 2)
      const remove = await removeItem('tshirt_001')
      for (const result of [add, update, remove]) {
        expect(result).toEqual({ ok: false, error: UNAVAILABLE })
      }
      expect(UNAVAILABLE).not.toMatch(/expired|empty/i)
      expectNoApiCall()
      expect(drawFor).not.toHaveBeenCalled()
    },
  )

  it.each(Object.entries(causes))('opens no cart ahead of an add, with %s', async (_cause, make) => {
    make()
    await expect(prepareCart()).resolves.toBeUndefined()
    expectNoApiCall()
  })

  it.each(Object.entries(causes))('sends an order back to the cart, with %s', async (_cause, make) => {
    make()
    await expect(redirectTarget(placeOrder)).resolves.toBe('/cart')
    expectNoApiCall()
  })
})

describe('placeOrder', () => {
  it('sends a visitor without a cart mirror back to the cart', async () => {
    await expect(redirectTarget(placeOrder)).resolves.toBe('/cart')
    expectNoApiCall()
  })

  it('sends an empty cart back to the cart and keeps its mirror', async () => {
    await seedCart('live', cart(0))
    await expect(redirectTarget(placeOrder)).resolves.toBe('/cart')
    expect(await mirror()).toMatchObject({ token: 'live' })
  })

  it('forgets the mirror of a cart with lines and lands on the checkout page, without an API call', async () => {
    await seedCart('live', cart(2))

    await expect(redirectTarget(placeOrder)).resolves.toBe('/checkout')

    expect(await mirror()).toBeNull()
    expectNoApiCall()
    expectOrderRefreshed()
  })

  it('stays on the cart when the mirror cannot be forgotten', async () => {
    await seedCart('live', cart(2))
    await seedVisit({ tshirt_001: 5 })
    vi.spyOn(sessionStore, 'clearCart').mockResolvedValue(false)

    await expect(redirectTarget(placeOrder)).resolves.toBe('/cart')
    expect(await visitStock()).toEqual({ tshirt_001: 5 })
  })

  it('takes the order off the visit and forgets the cart', async () => {
    await seedVisit({ tshirt_001: 5, mug_001: 4 })
    await seedCart('live', cart(2))

    await expect(redirectTarget(placeOrder)).resolves.toBe('/checkout')

    expect(await visitStock()).toEqual({ tshirt_001: 3, mug_001: 4 })
    expect(await mirror()).toBeNull()
    expectNoApiCall()
    expectOrderRefreshed()
  })

  it('sends a cart holding more than the draw back to be fixed', async () => {
    await seedVisit({ tshirt_001: 1 })
    await seedCart('live', cart(2))

    await expect(redirectTarget(placeOrder)).resolves.toBe('/cart')

    expect(await visitStock()).toEqual({ tshirt_001: 1 })
    expect(await mirror()).toMatchObject({ token: 'live', totalItems: 2 })
  })
})

describe('the visit caps every write', () => {
  it('refuses an add above the draw before calling the API', async () => {
    await seedCart('live')
    drawFor.mockResolvedValue(3)

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '4' })),
    ).resolves.toEqual({ ok: false, error: 'Only 3 available.' })

    expect(drawFor).toHaveBeenCalledExactlyOnceWith('tshirt_001')
    expectNoApiCall()
  })

  it('says out of stock rather than "only 0 available"', async () => {
    await seedCart('live')
    drawFor.mockResolvedValue(0)

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '1' })),
    ).resolves.toEqual({ ok: false, error: 'This product is out of stock.' })
  })

  it('allows an add up to the draw, with one call', async () => {
    await seedCart('live')
    drawFor.mockResolvedValue(3)
    mocked.addCartItem.mockResolvedValue(cart(3))

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '3' })),
    ).resolves.toEqual({
      ok: true,
      totalItems: 3,
      line: { productId: 'tshirt_001', quantity: 3 },
      lines: toLines(cart(3)),
    })

    expect(mocked.addCartItem).toHaveBeenCalledTimes(1)
    expect(mocked.updateCartItem).not.toHaveBeenCalled()
  })

  it('sets a line the API left above the draw back, keeps the capped cart and says why', async () => {
    await seedCart('live')
    drawFor.mockResolvedValue(2)
    // The cart already held two from an earlier visit, so one more is three.
    mocked.addCartItem.mockResolvedValue(cart(3))
    mocked.updateCartItem.mockResolvedValue(cart(2))

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '1' })),
    ).resolves.toEqual({
      ok: false,
      error: 'Only 2 available.',
      totalItems: 2,
      line: { productId: 'tshirt_001', quantity: 2 },
      lines: toLines(cart(2)),
    })

    expect(mocked.updateCartItem).toHaveBeenCalledWith('live', 'tshirt_001', 2)
    expect(await mirror()).toMatchObject({ totalItems: 2 })
  })

  it('keeps the over-drawn cart when it cannot be set back', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await seedCart('live')
    drawFor.mockResolvedValue(2)
    mocked.addCartItem.mockResolvedValue(cart(3))
    mocked.updateCartItem.mockRejectedValue(new ApiError(0, 'TIMEOUT', 'timed out', '/cart'))

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '1' })),
    ).resolves.toEqual({
      ok: false,
      error: 'Only 2 available.',
      totalItems: 3,
      line: { productId: 'tshirt_001', quantity: 3 },
      lines: toLines(cart(3)),
    })
    expect(await mirror()).toMatchObject({ totalItems: 3 })
  })

  it('refuses a quantity change above the draw before calling the API', async () => {
    await seedCart('live')
    drawFor.mockResolvedValue(4)

    await expect(updateQuantity('tshirt_001', 5)).resolves.toEqual({
      ok: false,
      error: 'Only 4 available.',
    })
    expectNoApiCall()
  })

  it('enforces nothing when the draw is unknown', async () => {
    await seedCart('live')
    drawFor.mockResolvedValue(null)
    mocked.addCartItem.mockResolvedValue(cart(99))

    await expect(
      addToCart(null, form({ productId: 'tshirt_001', quantity: '99' })),
    ).resolves.toMatchObject({ ok: true, totalItems: 99 })
  })
})

describe('prepareCart', () => {
  it('opens a cart and keeps it as the mirror for a visitor without one', async () => {
    mocked.createCart.mockResolvedValue(created('fresh'))

    await prepareCart()
    expect(await mirror()).toMatchObject({ token: 'fresh', lines: [], totalItems: 0 })
  })

  it('does nothing for a visitor who has a cart', async () => {
    await seedCart('live')

    await prepareCart()
    expect(mocked.createCart).not.toHaveBeenCalled()
    expect(await mirror()).toMatchObject({ token: 'live' })
  })

  it('lets the following add write once, into the prepared cart', async () => {
    mocked.createCart.mockResolvedValue(created('fresh'))
    mocked.addCartItem.mockResolvedValue(cart(1))

    await prepareCart()
    await addToCart(null, form({ productId: 'tshirt_001', quantity: '1' }))
    expect(mocked.createCart).toHaveBeenCalledTimes(1)
    expect(mocked.addCartItem).toHaveBeenCalledExactlyOnceWith('fresh', 'tshirt_001', 1)
  })

  it('leaves a failure to the add', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked.createCart.mockRejectedValue(new Error('the API is down'))

    await expect(prepareCart()).resolves.toBeUndefined()
    expect(await mirror()).toBeNull()
  })
})
