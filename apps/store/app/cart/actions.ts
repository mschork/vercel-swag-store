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
import type { Cart } from '@/lib/api/types'
import { clearCartToken, getCartToken, setCartToken } from '@/lib/cart/cookie'
import { toLines, type Line } from '@/lib/cart/lines'
import { CART_MAX_QUANTITY } from '@/lib/quantity'
import { getVisit, setVisit } from '@/lib/visit/cookie'
import { drawFor } from '@/lib/visit/draw'
import { exceedsDraw, tooMany } from '@/lib/visit/limits'
import { afterOrder } from '@/lib/visit/visit'

/**
 * Cart Server Actions (specs/E06-cart.md). Each one validates its input, calls
 * the API with the token from the httpOnly cookie and answers with user-facing
 * copy and the cart's item count, never its token. The count lets the header
 * badge update without reading the cart again.
 *
 * An add sets the cookie again, so its one-day expiry slides, and calls
 * `refresh()`. A quantity change and a removal do neither, because either one
 * re-renders the cart page inside the action's response, and the page then
 * reads the cart the write has just returned: a second slow call. They answer
 * with that cart's lines instead (specs/E23-cart-page-one-call.md).
 *
 * The API accepts any quantity of anything, so the limit a visitor sees is
 * enforced here or nowhere: every write is checked against their visit
 * (specs/E19-stable-visit.md).
 */

/** The product the action touched and the quantity the cart now holds of it. */
export interface CartLineResult {
  productId: string
  quantity: number
}

/**
 * `totalItems` is on every success, and on a failure whenever the action
 * read the cart, as it does after a 404. `line` travels with it so the client
 * can move a product's remaining stock without reading the cart again.
 * `lines` is the saved cart as the cart page renders it, on the writes that
 * do not refresh.
 */
export type CartActionResult =
  | { ok: true; totalItems: number; line: CartLineResult; lines?: Line[] }
  | { ok: false; error: string; totalItems?: number; line?: CartLineResult }
export type AddToCartState = CartActionResult | null

const EXPIRED = 'Your cart expired. Add products again to start a new cart.'
const NOT_IN_CART = 'This item is no longer in your cart.'

// Server Action input is a trust boundary: anyone can post these.
const ProductId = z.string().trim().min(1)

const AddToCartInput = z.object({
  productId: ProductId,
  quantity: z.coerce.number().int().positive(),
  // The opening draw the form showed; a value that does not parse is ignored.
  shown: z.coerce.number().int().min(0).max(CART_MAX_QUANTITY).optional().catch(undefined),
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
    shown: formData.get('shown') ?? undefined,
  })
  if (!input.success) {
    return {
      ok: false,
      error: quantityIssue(input.error)
        ? 'Choose a whole quantity of at least 1.'
        : 'This item could not be added.',
    }
  }
  const { productId, quantity, shown } = input.data
  const copy = {
    gone: 'This product is no longer available.',
    failed: 'This item could not be added. Try again.',
  }

  // Checked before the write, so an add the visit cannot cover costs no call.
  const draw = await drawFor(productId, { shown })
  if (exceedsDraw(quantity, draw) && draw !== null) {
    return { ok: false, error: tooMany(draw) }
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
    return write(token, productId, add(token), { ...copy, draw })
  }

  // Write first; only a 404 whose re-check finds no cart opens a new one.
  const token = await getCartToken()
  if (!token) return addToNewCart()
  return write(token, productId, add(token), { ...copy, draw, onExpired: addToNewCart })
}

/**
 * Creates the visitor's cart ahead of their first add, which then costs one
 * slow call in place of two (specs/E22-add-to-cart-wait.md). The form calls it
 * on intent. An action, because Next runs a client's actions one at a time: an
 * add clicked meanwhile queues behind it and finds the cookie. A failure is
 * left to the add, which opens a cart itself.
 */
export async function prepareCart(): Promise<void> {
  if (await getCartToken()) return
  try {
    await openCart()
  } catch (error) {
    unstable_rethrow(error)
    console.error('[cart] could not open a cart ahead of the add', error)
  }
}

/** Changes a line's quantity through `updateCartItem` (lib/api/cart.ts). */
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
  const draw = await drawFor(input.data.productId)
  if (exceedsDraw(input.data.quantity, draw) && draw !== null) {
    return { ok: false, error: tooMany(draw) }
  }
  return write(
    token,
    input.data.productId,
    () => updateCartItem(token, input.data.productId, input.data.quantity),
    {
      gone: NOT_IN_CART,
      failed: 'The quantity could not be changed. Try again.',
      draw,
      answerWithLines: true,
    },
  )
}

export async function removeItem(productId: string): Promise<CartActionResult> {
  const input = ProductId.safeParse(productId)
  if (!input.success) {
    return { ok: false, error: 'This item could not be removed.' }
  }
  const token = await getCartToken()
  if (!token) return expired()
  return write(token, input.data, () => removeCartItem(token, input.data), {
    gone: NOT_IN_CART,
    failed: 'This item could not be removed. Try again.',
    answerWithLines: true,
  })
}

/**
 * The demo order, bound to the Checkout form. Only a cart with lines can be
 * ordered; anything else goes back to `/cart`, which shows the true state.
 * Ordering drops the cookie and nothing more: the API has no clear-cart
 * endpoint and its cart expires on its own.
 * `redirect` throws, so it is never called inside a `try`.
 */
export async function placeOrder(): Promise<void> {
  const token = await getCartToken()
  const cart = token ? await orderableCart(token) : null
  if (!cart) redirect('/cart')
  const visit = await getVisit()
  if (visit) {
    if (cart.items.some((item) => exceedsDraw(item.quantity, visit.stock[item.productId] ?? null))) {
      redirect('/cart')
    }
    await setVisit(afterOrder(visit, cart.items))
  }
  await clearCartToken()
  redirect('/checkout')
}

/** Creates a cart and sets its cookie before the first write to it. */
async function openCart(): Promise<string> {
  const created = await createCart()
  await setCartToken(created.token)
  return created.token
}

type WriteOptions = {
  gone: string
  failed: string
  /**
   * What the visit says there is of the product, or `null` when the store
   * could not find out. A line the API leaves above it is set back.
   */
  draw?: number | null
  /**
   * What to do when a 404 turns out to be an expired cart. Defaults to
   * forgetting it; `addToCart` passes a single add into a new cart instead.
   */
  onExpired?: () => Promise<CartActionResult>
  /**
   * Answer a success with the cart's lines and leave the cookie and the route
   * alone, so the write is the action's only cart call.
   */
  answerWithLines?: boolean
}

/**
 * Runs one write and maps its outcome. Success sets the cookie again and
 * refreshes, or with `answerWithLines` does neither and returns the lines. A 404 is ambiguous, because the API answers `NOT_FOUND` for an
 * unknown cart, line and product alike, so it is followed by one `getCart`:
 * no cart means it expired, a cart means the line or product is gone. A 404
 * alone never clears the cookie. Other failures keep the cart as it is.
 */
async function write(
  token: string,
  productId: string,
  run: () => Promise<Cart>,
  copy: WriteOptions,
): Promise<CartActionResult> {
  let cart: Cart
  try {
    cart = await run()
  } catch (error) {
    unstable_rethrow(error)
    if (error instanceof ApiError && error.status === 404) {
      return afterNotFound(token, productId, copy)
    }
    console.error('[cart] write failed', error)
    return { ok: false, error: copy.failed }
  }
  const corrected = await capLine(token, cart, productId, copy.draw)
  if (copy.answerWithLines && !corrected) {
    return {
      ok: true,
      totalItems: cart.totalItems,
      line: lineOf(cart, productId),
      lines: toLines(cart),
    }
  }
  await setCartToken(token)
  refresh()
  if (corrected) return corrected
  return { ok: true, totalItems: cart.totalItems, line: lineOf(cart, productId) }
}

/**
 * Sets a line back to the draw when the API left it above one, which happens
 * when a product was already in the cart from an earlier visit. The second
 * slow call is paid only on a violation; an add within the draw costs exactly
 * what it did before this epic.
 */
async function capLine(
  token: string,
  cart: Cart,
  productId: string,
  draw: number | null | undefined,
): Promise<CartActionResult | null> {
  if (draw === undefined || draw === null) return null
  const line = lineOf(cart, productId)
  if (!exceedsDraw(line.quantity, draw)) return null
  try {
    const capped = await updateCartItem(token, productId, draw)
    return {
      ok: false,
      error: tooMany(draw),
      totalItems: capped.totalItems,
      line: lineOf(capped, productId),
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error('[cart] could not set an over-drawn line back', error)
    return { ok: false, error: tooMany(draw), totalItems: cart.totalItems, line }
  }
}

/** A product's quantity in the cart the API just returned; 0 once it is gone. */
function lineOf(cart: Cart, productId: string): CartLineResult {
  const item = cart.items.find((line) => line.productId === productId)
  return { productId, quantity: item?.quantity ?? 0 }
}

async function afterNotFound(
  token: string,
  productId: string,
  copy: WriteOptions,
): Promise<CartActionResult> {
  let cart: Cart | null
  try {
    cart = await getCart(token)
  } catch (error) {
    unstable_rethrow(error)
    console.error('[cart] could not re-check the cart after a 404', error)
    return { ok: false, error: copy.failed }
  }
  if (!cart) return copy.onExpired ? copy.onExpired() : expired()
  refresh()
  return {
    ok: false,
    error: copy.gone,
    totalItems: cart.totalItems,
    line: lineOf(cart, productId),
  }
}

/** Forgets an expired cart; the refresh re-renders `/cart` as empty. */
async function expired(): Promise<CartActionResult> {
  await clearCartToken()
  refresh()
  return { ok: false, error: EXPIRED, totalItems: 0 }
}

/** The cart to order, or `null` when there is nothing orderable. */
async function orderableCart(token: string): Promise<Cart | null> {
  try {
    const cart = await getCart(token)
    return cart && cart.items.length > 0 ? cart : null
  } catch (error) {
    unstable_rethrow(error)
    console.error('[cart] could not read the cart to place the order', error)
    return null
  }
}
