import 'server-only'
import { cookies } from 'next/headers'

/**
 * The cart token cookie (docs/adr/0002-cart-server-side-only.md). Reading
 * works wherever `cookies()` does. `setCartToken` and `clearCartToken` work
 * only inside Server Actions, where the response can still carry
 * `Set-Cookie`; pages never set cookies.
 */
export const CART_COOKIE = 'cart_token'

/**
 * One day, the API's idle expiry. Actions set the cookie again after every
 * successful write, so the cookie's expiry slides with the API cart's.
 */
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24

export async function getCartToken(): Promise<string | undefined> {
  const store = await cookies()
  return store.get(CART_COOKIE)?.value || undefined
}

export async function setCartToken(token: string): Promise<void> {
  const store = await cookies()
  store.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CART_COOKIE_MAX_AGE,
  })
}

export async function clearCartToken(): Promise<void> {
  const store = await cookies()
  store.delete({ name: CART_COOKIE, path: '/' })
}
