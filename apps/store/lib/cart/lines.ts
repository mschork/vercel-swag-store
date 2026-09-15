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

/** One optimistic change; quantity 0 removes the line, as the API does. */
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
