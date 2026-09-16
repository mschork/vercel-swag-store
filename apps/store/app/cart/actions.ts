'use server'

import { refresh } from 'next/cache'
import { redirect, unstable_rethrow } from 'next/navigation'
import { z } from 'zod'
import {
  addCartItem,
  createCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '@/lib/api/cart'
import { ApiError } from '@/lib/api/client'
import { clearCartToken, getCartToken, setCartToken } from '@/lib/cart/cookie'
import { CART_MAX_QUANTITY } from '@/lib/quantity'

/**
 * Cart Server Actions (specs/E06-cart.md). Each one validates its input, calls
 * the API with the token from the httpOnly cookie and answers with
 * user-facing copy, never with the cart: `refresh()` re-renders the badge and
 * the cart page from the server's own view in the same round trip. After a
 * successful write the cookie is set again, so its one-day expiry slides with
 * the API cart's.
 */

export type CartActionResult = { ok: true } | { ok: false; error: string }
export type AddToCartState = CartActionResult | null

const EXPIRED = 'Your cart expired. Add products again to start a new cart.'
const NOT_IN_CART = 'This item is no longer in your cart.'

// Server Action input is a trust boundary: anyone can post these.
const ProductId = z.string().trim().min(1)

const AddToCartInput = z.object({
  productId: ProductId,
  quantity: z.coerce.number().int().positive(),
})

const UpdateQuantityInput = z.object({
  productId: ProductId,
  quantity: z.number().int().min(0).max(CART_MAX_QUANTITY),
})

function quantityIssue(error: z.ZodError): boolean {
  return error.issues.some((issue) => issue.path[0] === 'quantity')
}

export async function addToCart(
  _previous: AddToCartState,
  formData: FormData,
): Promise<AddToCartState> {
  const input = AddToCartInput.safeParse({
    productId: formData.get('productId'),
    quantity: formData.get('quantity'),
  })
  if (!input.success) {
    return {
      ok: false,
      error: quantityIssue(input.error)
        ? 'Choose a whole quantity of at least 1.'
        : 'This item could not be added.',
    }
  }
  const { productId, quantity } = input.data
  const copy = {
    gone: 'This product is no longer available.',
    failed: 'This item could not be added. Try again.',
  }
  const add = (token: string) => () => addCartItem(token, productId, quantity)

  // Into a new cart: its 404 can only mean the product, so nothing retries.
  const addToNewCart = async (): Promise<CartActionResult> => {
    let token: string
    try {
      token = await openCart()
    } catch (error) {
      unstable_rethrow(error)
      console.error('[cart] could not open a cart', error)
      return { ok: false, error: copy.failed }
    }
    return write(token, add(token), copy)
  }

  // Write first; only a 404 whose re-check finds no cart opens a new one.
  const token = await getCartToken()
  if (!token) return addToNewCart()
  return write(token, add(token), { ...copy, onExpired: addToNewCart })
}

/** Sets a line's quantity; 0 removes the line, as the API does. */
export async function updateQuantity(
  productId: string,
  quantity: number,
): Promise<CartActionResult> {
  const input = UpdateQuantityInput.safeParse({ productId, quantity })
  if (!input.success) {
    return {
      ok: false,
      error: quantityIssue(input.error)
        ? `Choose a whole quantity from 1 to ${CART_MAX_QUANTITY}.`
        : 'This item could not be updated.',
    }
  }
  const token = await getCartToken()
  if (!token) return expired()
  return write(
    token,
    () => updateCartItem(token, input.data.productId, input.data.quantity),
    { gone: NOT_IN_CART, failed: 'The quantity could not be changed. Try again.' },
  )
}

export async function removeItem(productId: string): Promise<CartActionResult> {
  const input = ProductId.safeParse(productId)
  if (!input.success) {
    return { ok: false, error: 'This item could not be removed.' }
  }
  const token = await getCartToken()
  if (!token) return expired()
  return write(token, () => removeCartItem(token, input.data), {
    gone: NOT_IN_CART,
    failed: 'This item could not be removed. Try again.',
  })
}

/**
 * The demo order, bound to the Checkout form. Only a cart with lines can be
 * ordered; anything else goes back to `/cart`, which shows the true state.
 * Ordering drops the cookie and nothing more: the API has no clear-cart
 * endpoint and its cart expires on its own (specs/improvements.md).
 * `redirect` throws, so it is never called inside a `try`.
 */
export async function placeOrder(): Promise<void> {
  const token = await getCartToken()
  if (!token || !(await hasLines(token))) redirect('/cart')
  await clearCartToken()
  redirect('/checkout')
}

/** Creates a cart and sets its cookie before the first write to it. */
async function openCart(): Promise<string> {
  const created = await createCart()
  await setCartToken(created.token)
  return created.token
}

type WriteCopy = {
  gone: string
  failed: string
  /**
   * What to do when a 404 turns out to be an expired cart. Defaults to
   * forgetting it; `addToCart` passes a single add into a new cart instead.
   */
  onExpired?: () => Promise<CartActionResult>
}

/**
 * Runs one write and maps its outcome. Success sets the cookie again and
 * refreshes. A 404 is ambiguous, because the API answers `NOT_FOUND` for an
 * unknown cart, line and product alike, so it is followed by one `getCart`:
 * no cart means it expired, a cart means the line or product is gone. A 404
 * alone never clears the cookie. Other failures keep the cart as it is.
 */
async function write(
  token: string,
  run: () => Promise<unknown>,
  copy: WriteCopy,
): Promise<CartActionResult> {
  try {
    await run()
  } catch (error) {
    unstable_rethrow(error)
    if (error instanceof ApiError && error.status === 404) {
      return afterNotFound(token, copy)
    }
    console.error('[cart] write failed', error)
    return { ok: false, error: copy.failed }
  }
  await setCartToken(token)
  refresh()
  return { ok: true }
}

async function afterNotFound(
  token: string,
  copy: WriteCopy,
): Promise<CartActionResult> {
  let cartExists: boolean
  try {
    cartExists = (await getCart(token)) !== null
  } catch (error) {
    unstable_rethrow(error)
    console.error('[cart] could not re-check the cart after a 404', error)
    return { ok: false, error: copy.failed }
  }
  if (!cartExists) return copy.onExpired ? copy.onExpired() : expired()
  refresh()
  return { ok: false, error: copy.gone }
}

/** Forgets an expired cart; the refresh re-renders `/cart` to its empty state. */
async function expired(): Promise<CartActionResult> {
  await clearCartToken()
  refresh()
  return { ok: false, error: EXPIRED }
}

async function hasLines(token: string): Promise<boolean> {
  try {
    const cart = await getCart(token)
    return (cart?.items.length ?? 0) > 0
  } catch (error) {
    unstable_rethrow(error)
    console.error('[cart] could not read the cart to place the order', error)
    return false
  }
}
