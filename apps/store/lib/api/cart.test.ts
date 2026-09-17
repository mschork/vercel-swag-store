import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiError, fetchCall, headerOf, jsonResponse, mockFetch, ok, product, rawCart } from '@/test/helpers'
import { ApiError } from './client'
import { addCartItem, CART_TIMEOUT_MS, createCart, getCart, removeCartItem, updateCartItem } from './cart'

let fetchMock: ReturnType<typeof mockFetch>

beforeEach(() => {
  fetchMock = mockFetch()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createCart', () => {
  it('prefers the x-cart-token header and strips the token from the cart', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(201, { success: true, data: rawCart() }, { 'x-cart-token': 'header-token' }),
    )
    const { cart, token } = await createCart()
    expect(token).toBe('header-token')
    expect(cart).not.toHaveProperty('token')
    expect(cart.totalItems).toBe(0)
    const [url, init] = fetchCall(fetchMock)
    expect(url).toMatch(/\/cart\/create$/)
    expect(init.method).toBe('POST')
  })

  it('falls back to the body token when the header is missing', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { success: true, data: rawCart() }))
    const { token } = await createCart()
    expect(token).toBe('body-token')
  })
})

describe('getCart', () => {
  it('sends the token header and returns a cart without the token', async () => {
    const item = {
      productId: 'tshirt_001',
      quantity: 2,
      addedAt: '2026-09-14T00:00:00Z',
      product: product(),
      lineTotal: 6000,
    }
    fetchMock.mockResolvedValueOnce(ok(rawCart({ items: [item], totalItems: 2, subtotal: 6000 })))
    const cart = await getCart('abc')
    expect(cart).not.toBeNull()
    expect(cart).not.toHaveProperty('token')
    expect(cart?.items[0]?.lineTotal).toBe(6000)
    expect(headerOf(fetchCall(fetchMock)[1], 'x-cart-token')).toBe('abc')
  })

  it('returns null when the API says 404', async () => {
    fetchMock.mockResolvedValueOnce(apiError(404, 'NOT_FOUND', 'Cart not found or expired'))
    expect(await getCart('expired')).toBeNull()
  })

  it('rethrows any other error', async () => {
    fetchMock.mockResolvedValueOnce(apiError(400, 'BAD_REQUEST', 'Missing x-cart-token header'))
    await expect(getCart('')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('mutations', () => {
  it('addCartItem posts productId and quantity with the token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { success: true, data: rawCart({ totalItems: 2 }) }))
    const cart = await addCartItem('abc', 'tshirt_001', 2)
    expect(cart.totalItems).toBe(2)
    const [url, init] = fetchCall(fetchMock)
    expect(url).toMatch(/\/cart$/)
    expect(init.method).toBe('POST')
    expect(init.body).toBe('{"productId":"tshirt_001","quantity":2}')
    expect(headerOf(init, 'x-cart-token')).toBe('abc')
  })

  it('addCartItem defaults quantity to 1', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { success: true, data: rawCart() }))
    await addCartItem('abc', 'tshirt_001')
    expect(fetchCall(fetchMock)[1].body).toBe('{"productId":"tshirt_001","quantity":1}')
  })

  it('updateCartItem patches /cart/{productId}', async () => {
    fetchMock.mockResolvedValueOnce(ok(rawCart()))
    await updateCartItem('abc', 'tshirt_001', 3)
    const [url, init] = fetchCall(fetchMock)
    expect(url).toMatch(/\/cart\/tshirt_001$/)
    expect(init.method).toBe('PATCH')
    expect(init.body).toBe('{"quantity":3}')
  })

  it('removeCartItem deletes /cart/{productId} and never retries', async () => {
    fetchMock.mockResolvedValueOnce(ok(rawCart()))
    const cart = await removeCartItem('abc', 'tshirt_001')
    expect(cart.items).toEqual([])
    const [url, init] = fetchCall(fetchMock)
    expect(url).toMatch(/\/cart\/tshirt_001$/)
    expect(init.method).toBe('DELETE')
    expect(init.body).toBeUndefined()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('cart timeout', () => {
  it('gives every cart call 10 s instead of the default 5 s', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout')
    fetchMock.mockImplementation(async () => jsonResponse(200, { success: true, data: rawCart() }))
    await createCart()
    await getCart('abc')
    await addCartItem('abc', 'tshirt_001')
    await updateCartItem('abc', 'tshirt_001', 2)
    await removeCartItem('abc', 'tshirt_001')
    expect(CART_TIMEOUT_MS).toBe(10_000)
    expect(timeout.mock.calls).toEqual(Array.from({ length: 5 }, () => [CART_TIMEOUT_MS]))
  })
})
