import 'server-only'
import { getSession } from '@/lib/session/store'
import type { Line } from './lines'

/** The cart mirror as a component may hold it: everything but the token. */
export type CartView = { currency: string; lines: Line[]; totalItems: number }

/**
 * The visitor's cart for rendering, read from the cart mirror (CONTEXT.md).
 * It never calls the API. `null` is no cart: none opened yet, or one the
 * store has forgotten. `'unavailable'` is a session the store could not read,
 * which a surface shows as such and never as an empty cart.
 */
export async function loadCart(): Promise<CartView | null | 'unavailable'> {
  const session = await getSession()
  if (session === 'unavailable') return session
  if (!session.cart) return null
  const { currency, lines, totalItems } = session.cart
  return { currency, lines, totalItems }
}
