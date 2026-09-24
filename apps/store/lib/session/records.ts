import { z } from 'zod'
import { PromotionSchema } from '@/lib/api/schemas'
import type { Promotion } from '@/lib/api/types'
import { CART_MAX_QUANTITY } from '@/lib/quantity'

/**
 * What the session store keeps, and the parsing of it on the way out. A value
 * read from Redis crosses a trust boundary like any other input, so anything
 * that does not parse counts as absent.
 */

const StockDrawSchema = z.coerce.number().int().min(0).max(CART_MAX_QUANTITY)
const DrawnAtSchema = z.coerce.number().int().positive()

/**
 * The visit: a stock draw per product and the pinned promotion, kept for a
 * day from its first draw (CONTEXT.md). `promotion` is absent until a render
 * has claimed one; `null` is the API saying there is none.
 */
export interface VisitRecord {
  stock: Record<string, number>
  promotion?: Promotion | null
  /** Epoch seconds of the first draw. */
  drawnAt: number
}

export const LineSchema = z.object({
  productId: z.string().min(1),
  slug: z.string(),
  name: z.string(),
  image: z.string().nullable(),
  price: z.int().nonnegative(),
  quantity: z.int().nonnegative(),
})

/**
 * The cart mirror (CONTEXT.md) and the token that reaches the API's cart.
 * The token never leaves the server: the functions that hand the mirror to
 * components strip it.
 */
export const CartRecordSchema = z.object({
  token: z.string().min(1),
  currency: z.string(),
  lines: z.array(LineSchema),
  totalItems: z.int().nonnegative(),
  /** Epoch milliseconds of the write whose answer this is. */
  savedAt: z.int().positive(),
})

export type CartRecord = z.infer<typeof CartRecordSchema>

export const STOCK_FIELD = 'stock:'
export const PROMOTION_FIELD = 'promotion'
export const DRAWN_AT_FIELD = 'drawnAt'

/** A visit hash as `HGETALL` answers it, or `null` when there is none. */
export function parseVisit(reply: unknown): VisitRecord | null {
  if (!Array.isArray(reply) || reply.length === 0) return null
  const fields = new Map<string, unknown>()
  for (let i = 0; i + 1 < reply.length; i += 2) fields.set(String(reply[i]), reply[i + 1])

  const drawnAt = DrawnAtSchema.safeParse(fields.get(DRAWN_AT_FIELD))
  if (!drawnAt.success) return null
  const stock: Record<string, number> = {}
  for (const [field, value] of fields) {
    if (!field.startsWith(STOCK_FIELD)) continue
    const draw = parseDraw(value)
    if (draw !== null) stock[field.slice(STOCK_FIELD.length)] = draw
  }
  const promotion = parsePromotion(fields.get(PROMOTION_FIELD))
  return {
    stock,
    drawnAt: drawnAt.data,
    ...(promotion === undefined ? {} : { promotion }),
  }
}

export function parseDraw(value: unknown): number | null {
  const draw = StockDrawSchema.safeParse(value)
  return draw.success ? draw.data : null
}

/** A stored promotion; `undefined` when the field is absent or unreadable. */
export function parsePromotion(value: unknown): Promotion | null | undefined {
  if (typeof value !== 'string') return undefined
  try {
    const promotion = PromotionSchema.nullable().safeParse(JSON.parse(value))
    return promotion.success ? promotion.data : undefined
  } catch {
    return undefined
  }
}

/** A cart mirror as `GET` answers it, or `null` when there is none. */
export function parseCart(reply: unknown): CartRecord | null {
  if (typeof reply !== 'string') return null
  try {
    const cart = CartRecordSchema.safeParse(JSON.parse(reply))
    return cart.success ? cart.data : null
  } catch {
    return null
  }
}
