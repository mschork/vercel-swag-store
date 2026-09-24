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
import { toLines, type Line } from '@/lib/cart/lines'
import { CART_MAX_QUANTITY } from '@/lib/quantity'
import { getSession, sessionStore } from '@/lib/session/store'
import { drawFor } from '@/lib/visit/draw'
import { exceedsDraw, tooMany } from '@/lib/visit/limits'
import { afterOrder } from '@/lib/visit/visit'

/**
 * Cart Server Actions (docs/adr/0007-the-session-store.md). Each one validates
 * its input, calls the API with the token from the cart mirror, saves the
 * API's answer as the new mirror and answers with user-facing copy and the
 * saved lines, never the token. No action sets a cookie, and only an order
 * calls `refresh()`: the client applies the lines, so a response carries only
 * what was saved.
 *
 * The API accepts any quantity of anything, so the limit a visitor sees is
 * enforced here or nowhere: every write is checked against their visit.
 */

/** The product the action touched and the quantity the cart now holds of it. */
export interface CartLineResult {
  productId: string
  quantity: number
}

/**
 * Every success carries the saved cart: its count, the touched line and all
 * its lines. A failure carries them whenever the action learnt the cart's
 * state, as it does after a 404, an over-drawn line or an expired cart.
 */
export type CartActionResult =
  | { ok: true; totalItems: number; line: CartLineResult; lines: Line[] }
  | {
      ok: false
      error: string
      totalItems?: number
      line?: CartLineResult
      lines?: Line[]
    }
export type AddToCartState = CartActionResult | null

const EXPIRED = 'Your cart expired. Add products again to start a new cart.'
const NOT_IN_CART = 'This item is no longer in your cart.'
const UNAVAILABLE = 'Your cart cannot be reached right now. Try again in a moment.'

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
  const session = await getSession()
  if (session === 'unavailable') return { ok: false, error: UNAVAILABLE }
  const { sid } = session
  const { productId, quantity } = input.data
  const copy = {
    gone: 'This product is no longer available.',
    failed: 'This item could not be added. Try again.',
  }

  // Checked before the write, so an add the visit cannot cover costs no call.
  const draw = await drawFor(productId)
  if (exceedsDraw(quantity, draw) && draw !== null) {
    return { ok: false, error: tooMany(draw) }
  }
  const add = (token: string) => () => addCartItem(token, productId, quantity)

  // Into a new cart: its 404 can only mean the product, so nothing retries.
  const addToNewCart = async (): Promise<CartActionResult> => {
    const token = await openCart(sid)
    if (!token) return { ok: false, error: copy.failed }
    return write(sid, token, productId, add(token), { ...copy, draw })
  }

  // Write first; only a 404 whose re-check finds no cart opens a new one.
  const token = session.cart?.token
  if (!token) return addToNewCart()
  return write(sid, token, productId, add(token), {
    ...copy,
    draw,
    // The old cart is gone, so an answer that does not say otherwise is empty.
    onExpired: async () => ({ totalItems: 0, lines: [], ...(await addToNewCart()) }),
  })
}

/**
 * Opens the visitor's cart ahead of their first add, which then costs one
 * slow call in place of two. The form calls it on intent, through the queue
 * that runs the browser's cart writes one at a time (`lib/cart/in-order.ts`),
 * so an add clicked meanwhile finds the mirror; `openCart` keeps one cart if
 * two opens still meet. A failure is left to the add, which opens a cart
 * itself.
 */
export async function prepareCart(): Promise<void> {
  const session = await getSession()
  if (session === 'unavailable' || session.cart) return
  await openCart(session.sid)
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
  const session = await getSession()
  if (session === 'unavailable') return { ok: false, error: UNAVAILABLE }
  const token = session.cart?.token
  if (!token) return expired()
  const draw = await drawFor(input.data.productId)
  if (exceedsDraw(input.data.quantity, draw) && draw !== null) {
    return { ok: false, error: tooMany(draw) }
  }
  return write(
    session.sid,
    token,
    input.data.productId,
    () => updateCartItem(token, input.data.productId, input.data.quantity),
    {
      gone: NOT_IN_CART,
      failed: 'The quantity could not be changed. Try again.',
      draw,
    },
  )
}

export async function removeItem(productId: string): Promise<CartActionResult> {
  const input = ProductId.safeParse(productId)
  if (!input.success) {
    return { ok: false, error: 'This item could not be removed.' }
  }
  const session = await getSession()
  if (session === 'unavailable') return { ok: false, error: UNAVAILABLE }
  const token = session.cart?.token
  if (!token) return expired()
  return write(session.sid, token, input.data, () => removeCartItem(token, input.data), {
    gone: NOT_IN_CART,
    failed: 'This item could not be removed. Try again.',
  })
}

/**
 * The demo order, bound to the Checkout form. It orders the cart mirror,
 * which the store trusts, so it makes no API call. Only a mirror with lines,
 * each within its draw, can be ordered; anything else goes back to `/cart`,
 * which shows why. Ordering forgets the mirror, then lowers the draws: the API
 * has no clear-cart endpoint and its cart expires on its own. It is the one
 * action that refreshes, so the layout's badge and seed stop showing the cart
 * just ordered. `redirect` throws, so it is never called inside a `try`.
 */
export async function placeOrder(): Promise<void> {
  const session = await getSession()
  if (session === 'unavailable') redirect('/cart')
  const lines = session.cart?.lines ?? []
  if (lines.length === 0) redirect('/cart')
  const { visit } = session
  const overDrawn = lines.some((line) =>
    exceedsDraw(line.quantity, visit?.stock[line.productId] ?? null),
  )
  if (overDrawn) redirect('/cart')
  // A mirror the store could not forget is an order not placed.
  if (!(await sessionStore.clearCart(session.sid))) redirect('/cart')
  if (visit) await sessionStore.setStock(session.sid, afterOrder(visit.stock, lines))
  refresh()
  redirect('/checkout')
}

/**
 * Creates a cart and claims the mirror with it, empty, before the first write
 * to it, answering the token of the cart that won: an action that opened one
 * meanwhile keeps its cart, and this one is left for the API to expire.
 * `null` when either step fails: a token the store cannot keep would put the
 * add in a cart nobody can reach again.
 */
async function openCart(sid: string): Promise<string | null> {
  let created: { cart: Cart; token: string }
  try {
    created = await createCart()
  } catch (error) {
    unstable_rethrow(error)
    console.error('[cart] could not open a cart', error)
    return null
  }
  const kept = await sessionStore.claimCart(sid, mirrorOf(created.token, created.cart))
  return kept?.token ?? null
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
   * What to do when a 404 turns out to be an expired cart, after its mirror is
   * cleared. Defaults to saying so; `addToCart` adds into a new cart instead.
   */
  onExpired?: () => Promise<CartActionResult>
}

/**
 * Runs one write, saves the API's answer as the mirror and maps the outcome.
 * A 404 is ambiguous, because the API answers `NOT_FOUND` for an unknown cart,
 * line and product alike, so it is followed by one `getCart`: no cart means it
 * expired, a cart means the line or product is gone. Other failures leave the
 * mirror as it is.
 */
async function write(
  sid: string,
  token: string,
  productId: string,
  run: () => Promise<Cart>,
  copy: WriteOptions,
): Promise<CartActionResult> {
  let written: Cart
  try {
    written = await run()
  } catch (error) {
    unstable_rethrow(error)
    if (error instanceof ApiError && error.status === 404) {
      return afterNotFound(sid, token, productId, copy)
    }
    console.error('[cart] write failed', error)
    return { ok: false, error: copy.failed }
  }
  const { cart, error } = await capLine(token, written, productId, copy.draw)
  const answer = { ...(await save(sid, token, cart)), line: lineOf(cart, productId) }
  return error ? { ok: false, error, ...answer } : { ok: true, ...answer }
}

/**
 * Sets a line back to the draw when the API left it above one, which happens
 * when a product was already in the cart from an earlier visit. The second
 * slow call is paid only on a violation. Answers the cart as it now stands,
 * with the refusal to show when the line was over its draw.
 */
async function capLine(
  token: string,
  cart: Cart,
  productId: string,
  draw: number | null | undefined,
): Promise<{ cart: Cart; error?: string }> {
  if (draw === undefined || draw === null) return { cart }
  if (!exceedsDraw(lineOf(cart, productId).quantity, draw)) return { cart }
  try {
    return { cart: await updateCartItem(token, productId, draw), error: tooMany(draw) }
  } catch (error) {
    unstable_rethrow(error)
    console.error('[cart] could not set an over-drawn line back', error)
    return { cart, error: tooMany(draw) }
  }
}

async function afterNotFound(
  sid: string,
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
  if (!cart) {
    await sessionStore.clearCart(sid)
    return copy.onExpired ? copy.onExpired() : expired()
  }
  const answer = { ...(await save(sid, token, cart)), line: lineOf(cart, productId) }
  return { ok: false, error: copy.gone, ...answer }
}

/**
 * Saves the API's latest answer as the mirror and answers what the client
 * applies. A save that fails is logged by the store; the answer is still the
 * API's, and the next cart page view corrects the mirror.
 */
async function save(
  sid: string,
  token: string,
  cart: Cart,
): Promise<{ totalItems: number; lines: Line[] }> {
  const mirror = mirrorOf(token, cart)
  await sessionStore.setCart(sid, mirror)
  return { totalItems: mirror.totalItems, lines: mirror.lines }
}

function mirrorOf(token: string, cart: Cart) {
  return { token, currency: cart.currency, lines: toLines(cart), totalItems: cart.totalItems }
}

/** A product's quantity in the cart the API just returned; 0 once it is gone. */
function lineOf(cart: Cart, productId: string): CartLineResult {
  const item = cart.items.find((line) => line.productId === productId)
  return { productId, quantity: item?.quantity ?? 0 }
}

/** The answer for a cart that no longer exists: empty, with no lines. */
function expired(): CartActionResult {
  return { ok: false, error: EXPIRED, totalItems: 0, lines: [] }
}
