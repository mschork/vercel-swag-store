import 'server-only'
import { cache } from 'react'
import { getCart } from '@/lib/api/cart'
import type { Cart } from '@/lib/api/types'
import { loadOptional } from '@/lib/load-optional'
import { getCartToken } from './cookie'

/**
 * The visitor's cart for rendering. `null` means there is nothing to show: no
 * cookie yet, or the API no longer knows the token (an expired cart). The
 * cookie is left alone, because a render cannot set cookies; the next action
 * replaces or clears it. Any other failure throws.
 *
 * Memoized per request with React's `cache()`: the badge and the cart page
 * share one slow read. `fetch` memoization cannot do it, because the client's
 * timeout signal opts every request out of it.
 */
export const getCartFromCookie = cache(async (): Promise<Cart | null> => {
  const token = await getCartToken()
  return token ? getCart(token) : null
})

/**
 * `getCartFromCookie` for components that render without the cart when the
 * API fails. The cart comes back wrapped so the two answers a bare `null`
 * would merge stay apart: `{ cart: null }` is an empty or expired cart, `null`
 * is a failed call, already logged by `loadOptional`.
 */
export function loadCart(label: string): Promise<{ cart: Cart | null } | null> {
  return loadOptional(label, async () => ({ cart: await getCartFromCookie() }))
}
