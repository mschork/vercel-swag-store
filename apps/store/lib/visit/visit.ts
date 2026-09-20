import { z } from 'zod'
import { PromotionSchema } from '@/lib/api/schemas'
import { CART_MAX_QUANTITY } from '@/lib/quantity'

/**
 * What the store remembers about one visitor: the stock it drew per product
 * and the promotion it pinned. The API redraws both on every request, so
 * without this the store could not show the same number twice
 * (docs/adr/0006-the-stable-visit.md).
 */
export const VisitSchema = z.object({
  v: z.literal(1),
  drawnAt: z.int().positive(),
  stock: z.record(z.string(), z.int().min(0).max(CART_MAX_QUANTITY)),
  promotion: PromotionSchema.nullable(),
})

export type Visit = z.infer<typeof VisitSchema>

/** One day, fixed: a visit that runs out is a restock, so the expiry never slides. */
export const VISIT_MAX_AGE_SECONDS = 60 * 60 * 24

/**
 * Most bytes the cookie's value may take. A cookie holds about 4 KB including
 * its name and attributes, which cost about 70 here.
 */
export const MAX_VISIT_BYTES = 4000

/**
 * The cookie carries base64url, not JSON. A promotion's text is arbitrary and
 * the API's promotions contain per-cent signs ("save 10% automatically"); a
 * bare `%` in a cookie value makes the percent-decoding in the request path
 * throw `URIError: URI malformed`, which fails the whole request. base64url
 * uses only `A-Z a-z 0-9 - _`, which no encoding or decoding step alters.
 */
export function encodeVisit(json: string): string {
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** The inverse; `null` for anything that is not the value we wrote. */
export function decodeVisit(value: string): string | null {
  try {
    const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/'))
    return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
  } catch {
    return null
  }
}

/** A visit's age in seconds, for the expiry and the cookie's remaining `maxAge`. */
export function visitAge(visit: Visit, now: number): number {
  return Math.floor(now / 1000) - visit.drawnAt
}

/**
 * The cookie's value as a visit, or `null` when there is nothing usable: no
 * cookie, a value that is not the current shape, or one drawn over a day ago.
 * A cookie is input, so anything unexpected counts as no visit rather than an
 * error; the next call to the route handler draws a fresh one.
 */
export function parseVisit(raw: string | undefined, now: number): Visit | null {
  if (!raw) return null
  const decoded = decodeVisit(raw)
  if (decoded === null) return null
  let json: unknown
  try {
    json = JSON.parse(decoded)
  } catch {
    return null
  }
  const parsed = VisitSchema.safeParse(json)
  if (!parsed.success) return null
  return visitAge(parsed.data, now) >= VISIT_MAX_AGE_SECONDS ? null : parsed.data
}

/**
 * The visit as a cookie value, with the stock entries that do not fit dropped
 * from the end. base64 costs a third on top of the JSON, so the size is
 * measured on the encoded form. The promotion is kept whatever happens,
 * because a banner cannot degrade the way a missing count can: a product left
 * out renders "Stock unavailable". `stock` keeps its insertion order, so the
 * caller decides which products are worth the room.
 */
export function serialiseVisit(visit: Visit): { value: string; dropped: string[] } {
  let value = encodeVisit(JSON.stringify(visit))
  if (value.length <= MAX_VISIT_BYTES) return { value, dropped: [] }

  const entries = Object.entries(visit.stock)
  const dropped: string[] = []
  while (entries.length > 0) {
    const [id] = entries.pop() as [string, number]
    dropped.push(id)
    value = encodeVisit(JSON.stringify({ ...visit, stock: Object.fromEntries(entries) }))
    if (value.length <= MAX_VISIT_BYTES) break
  }
  return { value, dropped }
}

/**
 * The visit with an order's lines taken off it, never below nothing. Buying
 * is the one thing that reduces stock for good: everything else a visitor
 * does to their cart is given back when they undo it.
 */
export function afterOrder(
  visit: Visit,
  lines: readonly { productId: string; quantity: number }[],
): Visit {
  const stock = { ...visit.stock }
  for (const { productId, quantity } of lines) {
    const draw = stock[productId]
    if (draw !== undefined) stock[productId] = Math.max(0, draw - quantity)
  }
  return { ...visit, stock }
}
