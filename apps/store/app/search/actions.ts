'use server'

import { z } from 'zod'
import { getCategories } from '@/lib/api/categories'
import { getAllProducts, getFeaturedProducts } from '@/lib/api/products'
import { RESULT_CAP, normaliseQuery, searchCatalogue } from '@/lib/search'
import { recordGapAfterResponse } from '@/lib/search/record-gap'

/** Long enough for any query the form sends; `normaliseQuery` cuts it further. */
const Query = z.string().max(256)

/**
 * Records a query the browser searched and found nothing for. The search is
 * run again here over the same cached catalogue, so only a query that really
 * finds nothing is ever counted, whatever a caller sends. Never throws.
 */
export async function reportSearchGap(raw: unknown): Promise<void> {
  const parsed = Query.safeParse(raw)
  if (!parsed.success) return
  const query = normaliseQuery(parsed.data)
  if (!query) return
  const [catalogue, featured, categories] = await Promise.all([
    getAllProducts(),
    getFeaturedProducts({ limit: RESULT_CAP, min: RESULT_CAP }),
    getCategories(),
  ]).catch(() => [null, null, null] as const)
  if (!catalogue || !featured || !categories) return
  const outcome = searchCatalogue({
    query,
    category: null,
    catalogue,
    categories,
    featuredIds: featured.map((product) => product.id),
  })
  if (outcome.ids.length === 0) await recordGapAfterResponse(query)
}
