import 'server-only'
import { ApiError, fetchApi } from './client'
import { CartSchema, RawCartSchema, withoutToken } from './schemas'
import type { Cart } from './types'

/**
 * Cart calls. Live data, never cached. The token is an explicit argument so
 * this module never touches `cookies()` and stays unit-testable; cookie
 * handling lives in `app/cart/actions.ts` (E06). Nothing here retries: every
 * cart call is a mutation or is cheap enough to fail fast.
 *
 * The API's `{itemId}` path segment is the product id, not a line-item id.
 */

/**
 * The cart namespace answers in 1.5 to 3 s (specs/callout.md), so its calls
 * wait longer than the client's default before giving up. A write aborted
 * early can still land on the API while the store reports a failure.
 */
export const CART_TIMEOUT_MS = 10_000

const tokenHeader = (token: string) => ({ 'x-cart-token': token })

/**
 * Creates an empty cart. The only function that returns a token: read from
 * the `x-cart-token` response header, falling back to the raw body before
 * the token is stripped (docs/adr/0002-cart-server-side-only.md).
 */
export async function createCart(): Promise<{ cart: Cart; token: string }> {
  const { data, headers } = await fetchApi('/cart/create', {
    method: 'POST',
    schema: RawCartSchema,
    timeoutMs: CART_TIMEOUT_MS,
  })
  const token = headers.get('x-cart-token') ?? data.token
  return { cart: withoutToken(data), token }
}

/** The cart for `token`, or `null` when the API no longer knows it (expired after 24 h idle, or bogus). */
export async function getCart(token: string): Promise<Cart | null> {
  try {
    const { data } = await fetchApi('/cart', {
      schema: CartSchema,
      headers: tokenHeader(token),
      timeoutMs: CART_TIMEOUT_MS,
    })
    return data
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function addCartItem(token: string, productId: string, quantity = 1): Promise<Cart> {
  const { data } = await fetchApi('/cart', {
    method: 'POST',
    body: { productId, quantity },
    schema: CartSchema,
    headers: tokenHeader(token),
    timeoutMs: CART_TIMEOUT_MS,
  })
  return data
}

/** Sets the quantity of a line; the API removes the line at 0. */
export async function updateCartItem(token: string, productId: string, quantity: number): Promise<Cart> {
  const { data } = await fetchApi(`/cart/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    body: { quantity },
    schema: CartSchema,
    headers: tokenHeader(token),
    timeoutMs: CART_TIMEOUT_MS,
  })
  return data
}

export async function removeCartItem(token: string, productId: string): Promise<Cart> {
  const { data } = await fetchApi(`/cart/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    schema: CartSchema,
    headers: tokenHeader(token),
    timeoutMs: CART_TIMEOUT_MS,
  })
  return data
}
