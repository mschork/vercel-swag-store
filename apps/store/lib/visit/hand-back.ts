import { z } from 'zod'
import { PromotionSchema } from '@/lib/api/schemas'
import { CART_MAX_QUANTITY } from '@/lib/quantity'
import type { HandBack } from './open'

/** A promotion from the API serialises to about 300 bytes; the cookie holds 4 KB. */
const PROMOTION_MAX_BYTES = 1024

const DrawSchema = z.object({
  productId: z.string().min(1),
  count: z.number().int().min(0).max(CART_MAX_QUANTITY),
})

/**
 * Reads a hand-back from a request. A trust boundary: each value is checked on
 * its own, and one that fails is left out so the route draws it fresh. Only a
 * JSON request is read, which a cross-site form cannot send.
 */
export async function readHandBack(request: Request): Promise<HandBack> {
  const type = request.headers.get('content-type') ?? ''
  if (!type.toLowerCase().startsWith('application/json')) return {}
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return {}
  }
  if (typeof body !== 'object' || body === null) return {}
  const { draw, promotion } = body as Record<string, unknown>
  const parsedDraw = DrawSchema.safeParse(draw)
  const parsedPromotion = PromotionSchema.safeParse(promotion)
  return {
    ...(parsedDraw.success ? { draw: parsedDraw.data } : {}),
    ...(parsedPromotion.success &&
    parsedPromotion.data.active &&
    JSON.stringify(parsedPromotion.data).length <= PROMOTION_MAX_BYTES
      ? { promotion: parsedPromotion.data }
      : {}),
  }
}
