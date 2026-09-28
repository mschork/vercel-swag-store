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

/** What a cart row shows for a product, recorded at the click of an add. */
export type LineDisplay = Pick<Line, 'slug' | 'name' | 'image' | 'price'>

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

/**
 * Quantities a row shows before it saves them, by product id. They sit above
 * the optimistic lines, so a change still waiting for its pause shows at once.
 */
export type Drafts = Readonly<Record<string, number>>

export function applyDrafts<T extends Line>(lines: T[], drafts: Drafts): T[] {
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
export function cartTotals(lines: readonly Line[]): {
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

/** A line with the writes still saving applied, and which kind it waits for. */
export type LineWithWrites = Line & {
  /** An add of it is saving; the cart page shows the row as saving. */
  pending: boolean
  /** A quantity change or a removal of it is saving. */
  changing: boolean
}

/** A cart write sent and not yet answered: an add, or a line's new quantity (0 removes it). */
export type Write =
  | { kind: 'add'; productId: string; quantity: number; display: LineDisplay }
  | { kind: 'set'; productId: string; quantity: number }

/**
 * The cart every surface shows: the saved lines, each write in flight applied
 * in the order it was sent, then the drafts. An add of a product the saved
 * lines lack is a pending line at the end.
 */
export function linesWithWrites(
  saved: readonly Line[],
  writes: readonly Write[],
  drafts: Drafts,
): LineWithWrites[] {
  const base = saved.map((line): LineWithWrites => ({ ...line, pending: false, changing: false }))
  return applyDrafts(writes.reduce(applyWrite, base), drafts)
}

function applyWrite(lines: LineWithWrites[], write: Write): LineWithWrites[] {
  const { productId, quantity } = write
  const line = lines.find((entry) => entry.productId === productId)
  if (write.kind === 'set') {
    if (quantity === 0) return lines.filter((entry) => entry !== line)
    return lines.map((entry) => (entry === line ? { ...entry, quantity, changing: true } : entry))
  }
  if (quantity <= 0) return lines
  if (!line) {
    return [...lines, { ...write.display, productId, quantity, pending: true, changing: false }]
  }
  return lines.map((entry) =>
    entry === line
      ? { ...entry, ...write.display, quantity: entry.quantity + quantity, pending: true }
      : entry,
  )
}
