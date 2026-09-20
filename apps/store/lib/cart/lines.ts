import type { Cart } from '@/lib/api/types'

/**
 * A cart line as the cart page renders it: only what a row shows, so the
 * client payload carries no descriptions or tags. Pure and safe for client
 * components. `price` is the unit price in cents.
 */
export type Line = {
  productId: string
  slug: string
  name: string
  image: string | null
  price: number
  quantity: number
}

export function toLines(cart: Cart): Line[] {
  return cart.items.map(({ productId, quantity, product }) => ({
    productId,
    slug: product.slug,
    name: product.name,
    image: product.images[0] ?? null,
    price: product.price,
    quantity,
  }))
}

/** One optimistic change, mirroring `updateCartItem` in `lib/api/cart.ts`. */
export type LineChange = { productId: string; quantity: number }

export function applyLineChange(
  lines: Line[],
  { productId, quantity }: LineChange,
): Line[] {
  if (quantity === 0) return lines.filter((line) => line.productId !== productId)
  return lines.map((line) =>
    line.productId === productId ? { ...line, quantity } : line,
  )
}

/**
 * Quantities a row shows before it saves them, by product id. They sit above
 * the optimistic lines, so a change still waiting for its pause shows at once.
 */
export type Drafts = Readonly<Record<string, number>>

export function applyDrafts(lines: Line[], drafts: Drafts): Line[] {
  return lines.map((line) => {
    const quantity = drafts[line.productId]
    return quantity === undefined || quantity === line.quantity
      ? line
      : { ...line, quantity }
  })
}

/**
 * Sets a draft, or with `null` removes it. With `onlyIf` the draft is removed
 * only while it still holds that value, so a save that finishes late never
 * wipes a newer change.
 */
export function setDraft(
  drafts: Drafts,
  productId: string,
  quantity: number | null,
  onlyIf?: number,
): Drafts {
  if (quantity !== null) {
    return drafts[productId] === quantity ? drafts : { ...drafts, [productId]: quantity }
  }
  if (!(productId in drafts)) return drafts
  if (onlyIf !== undefined && drafts[productId] !== onlyIf) return drafts
  const next = { ...drafts }
  delete next[productId]
  return next
}

/**
 * Item count and subtotal from price × quantity, the same arithmetic as the
 * API's `lineTotal` and `subtotal`, so optimistic lines total correctly before
 * the server answers.
 */
export function cartTotals(lines: Line[]): {
  totalItems: number
  subtotal: number
} {
  let totalItems = 0
  let subtotal = 0
  for (const line of lines) {
    totalItems += line.quantity
    subtotal += line.price * line.quantity
  }
  return { totalItems, subtotal }
}
