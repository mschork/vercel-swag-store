import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/lib/api/cart'
import { ApiError } from '@/lib/api/client'
import type { Cart } from '@/lib/api/types'
import { sessionStore, type CartRecord } from '@/lib/session/store'
import { product } from '@/test/helpers'
import { toLines } from './lines'
import { reconcileCart } from './reconcile'

vi.mock('@/lib/api/cart', () => ({ getCart: vi.fn() }))

const getCart = vi.mocked(api.getCart)

let sid = ''

function cart(quantity: number): Cart {
  return {
    items:
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
          ],
    totalItems: quantity,
    subtotal: 3000 * quantity,
    currency: 'USD',
    createdAt: '2026-09-15T00:00:00Z',
    updatedAt: '2026-09-15T00:00:00Z',
  }
}

/** Saves the mirror as an action would, and answers the record the render reads. */
async function save(token: string, from: Cart): Promise<CartRecord> {
  await sessionStore.setCart(sid, {
    token,
    currency: from.currency,
    lines: toLines(from),
    totalItems: from.totalItems,
  })
  return mirror()
}

async function mirror(): Promise<CartRecord> {
  const state = await sessionStore.read(sid)
  if (state === 'unavailable' || !state.cart) throw new Error('Expected a cart mirror')
  return state.cart
}

async function hasMirror(): Promise<boolean> {
  const state = await sessionStore.read(sid)
  return state !== 'unavailable' && state.cart !== null
}

// The store stamps `savedAt` in milliseconds; a newer save needs a later one.
const tick = () => new Promise((resolve) => setTimeout(resolve, 2))

beforeEach(() => {
  sid = crypto.randomUUID()
  vi.resetAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('reconcileCart', () => {
  it('leaves a mirror that matches the API as it is', async () => {
    const shown = await save('live', cart(2))
    getCart.mockResolvedValue(cart(2))

    await reconcileCart(sid, shown.savedAt)

    expect(getCart).toHaveBeenCalledExactlyOnceWith('live')
    expect(await mirror()).toEqual(shown)
  })

  it('writes the API answer over a mirror that drifted, keeping the token', async () => {
    const shown = await save('live', cart(2))
    getCart.mockResolvedValue(cart(3))
    await tick()

    await reconcileCart(sid, shown.savedAt)

    const corrected = await mirror()
    expect(corrected).toMatchObject({
      token: 'live',
      totalItems: 3,
      lines: [{ productId: 'tshirt_001', quantity: 3 }],
    })
    expect(corrected.savedAt).toBeGreaterThan(shown.savedAt)
  })

  it('clears the mirror of a cart the API no longer knows', async () => {
    const shown = await save('expired', cart(2))
    getCart.mockResolvedValue(null)

    await reconcileCart(sid, shown.savedAt)

    expect(await hasMirror()).toBe(false)
  })

  it('leaves alone a mirror an action saved during the read', async () => {
    const shown = await save('live', cart(2))
    getCart.mockImplementation(async () => {
      await tick()
      await save('live', cart(5))
      return cart(3)
    })

    await reconcileCart(sid, shown.savedAt)

    expect(await mirror()).toMatchObject({ totalItems: 5 })
  })

  it('never clears a new cart opened during the read', async () => {
    const shown = await save('expired', cart(2))
    getCart.mockImplementation(async () => {
      await tick()
      await save('fresh', cart(1))
      return null
    })

    await reconcileCart(sid, shown.savedAt)

    expect(await mirror()).toMatchObject({ token: 'fresh', totalItems: 1 })
  })

  it('makes no call when the mirror is newer than the render', async () => {
    const shown = await save('live', cart(2))
    await tick()
    await save('live', cart(4))

    await reconcileCart(sid, shown.savedAt)

    expect(getCart).not.toHaveBeenCalled()
  })

  it('makes no call when the store does not answer', async () => {
    vi.spyOn(sessionStore, 'read').mockResolvedValue('unavailable')

    await reconcileCart(sid, Date.now())

    expect(getCart).not.toHaveBeenCalled()
  })

  it('logs a failed read and leaves the mirror as it is', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const shown = await save('live', cart(2))
    getCart.mockRejectedValue(new ApiError(0, 'TIMEOUT', 'timed out', '/cart'))

    await expect(reconcileCart(sid, shown.savedAt)).resolves.toBeUndefined()

    expect(error).toHaveBeenCalledTimes(1)
    expect(await mirror()).toEqual(shown)
  })
})
