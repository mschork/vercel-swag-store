/**
 * Remaining: what every surface shows and enforces about a product's stock,
 * from the visit's draw and what the visitor's cart holds (CONTEXT.md). No
 * zod and nothing server-only, so a client component says what the cart
 * actions enforce.
 *
 * `draw` is `null` when the visit has no count for the product, because the
 * draw failed. Such a product is not available: nothing of it can be added,
 * changed or ordered, only removed.
 */

/** The visit's draw for one product; `null` when it has none. */
export type Draw = number | null

/** The draw minus what the cart holds, never below nothing. */
export function remaining(draw: Draw, inCart: number): number {
  return draw === null ? 0 : Math.max(0, draw - inCart)
}

/** Whether the cart may hold `quantity` of a product. */
export function allows(draw: Draw, quantity: number): boolean {
  return draw !== null && quantity <= draw
}

/**
 * What a visitor is told when a quantity is refused. `inCart` is what the
 * cart already holds when the quantity is added to it, and 0 when the
 * quantity replaces the line.
 */
export function refusal(draw: Draw, inCart: number): string {
  if (draw === null) return 'This product is not available right now.'
  if (draw === 0) return 'This product is out of stock.'
  if (inCart === 0) return `Only ${draw} available.`
  const left = remaining(draw, inCart)
  return left === 0 ? `All ${draw} are in your cart.` : `Only ${left} more available.`
}

/**
 * Where "Only N left" starts, matching the boundary of the API's own
 * `lowStock` flag: true from 1 to 5, false from 6 up.
 */
export const LOW_STOCK_THRESHOLD = 5

export type StockTone = 'success' | 'warning' | 'danger' | 'muted'

/** A product page's stock line and what its Add to Cart button allows. */
export interface PageStock {
  label: string
  tone: StockTone
  /**
   * What the button says in place of Add to Cart when nothing is left to
   * add; null when there is something to add.
   */
  unavailableLabel: string | null
  /** The largest quantity the stepper allows: what remains, 0 when nothing does. */
  maxQuantity: number
}

/** The button when the product cannot be had, known or not. */
const UNAVAILABLE = 'Currently unavailable'

/**
 * The product page's stock line and Add to Cart limits. The label always
 * carries the meaning, so colour is never the only cue.
 */
export function pageStock(draw: Draw, inCart = 0): PageStock {
  if (draw === null) {
    return {
      label: 'Stock unavailable',
      tone: 'muted',
      unavailableLabel: UNAVAILABLE,
      maxQuantity: 0,
    }
  }
  if (draw === 0) {
    return {
      label: 'This item is out of stock at the moment. Check back soon.',
      tone: 'danger',
      unavailableLabel: UNAVAILABLE,
      maxQuantity: 0,
    }
  }
  const left = remaining(draw, inCart)
  if (left === 0) {
    return {
      label: `All ${draw} are in your cart`,
      tone: 'warning',
      unavailableLabel: 'All in your cart',
      maxQuantity: 0,
    }
  }
  const low = left <= LOW_STOCK_THRESHOLD
  return {
    label: low ? `Only ${left} left` : 'In stock',
    tone: low ? 'warning' : 'success',
    unavailableLabel: null,
    maxQuantity: left,
  }
}

/**
 * A product card's stock badge; `null` for a product a visitor can simply
 * buy, so the badge means "read this", and for an unknown draw. Worded for
 * the card: a whole draw in the cart reads "In your cart" here and "All N are
 * in your cart" on the product page.
 */
export function cardStock(
  draw: Draw,
  inCart: number,
): { label: string; tone: Exclude<StockTone, 'success'> } | null {
  if (draw === null) return null
  if (draw === 0) return { label: 'Out of stock', tone: 'danger' }
  const left = remaining(draw, inCart)
  if (left === 0) return { label: 'In your cart', tone: 'muted' }
  if (left <= LOW_STOCK_THRESHOLD) return { label: `Only ${left} left`, tone: 'warning' }
  return null
}
