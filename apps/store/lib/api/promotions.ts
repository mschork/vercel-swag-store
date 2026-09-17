import 'server-only'
import { fetchApi } from './client'
import { PromotionSchema } from './schemas'
import type { Promotion } from './types'

/**
 * Live data, never cached: the API rotates the promotion per request.
 * Callers render it inside `<Suspense>`. Returns `null` when the API sends
 * no promotion or one that is not active, so pages need a single check.
 */
export async function getPromotion(): Promise<Promotion | null> {
  const { data } = await fetchApi('/promotions', { cache: 'live', schema: PromotionSchema.nullable() })
  return data?.active ? data : null
}
