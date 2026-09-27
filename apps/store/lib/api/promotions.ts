import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { unstable_rethrow } from 'next/navigation'
import { CATALOG_PROFILE, TAGS } from './cache'
import { ApiError, fetchApi } from './client'
import { PromotionSchema } from './schemas'
import type { Promotion } from './types'

/**
 * The promotion every visitor sees, or `null` when the API has none active.
 * Cached with the catalogue, so the banner is part of every page's static
 * shell (docs/adr/0006-the-stable-visit.md). The cache is remote because
 * the API picks a promotion at random per call: one shared entry keeps the
 * pages from each caching a different one.
 *
 * A failed read is logged and answers `null` with the short `minutes`
 * lifetime, so the next revalidation asks again and one bad call neither
 * fails the build nor hides the banner for an hour.
 */
export async function getPromotion(): Promise<Promotion | null> {
  'use cache: remote'
  cacheTag(TAGS.promotion)
  try {
    const { data } = await fetchApi('/promotions', { cache: 'cached', schema: PromotionSchema.nullable() })
    cacheLife(CATALOG_PROFILE)
    return data?.active ? data : null
  } catch (error) {
    unstable_rethrow(error)
    if (error instanceof ApiError && error.status === 404) {
      cacheLife(CATALOG_PROFILE)
      return null
    }
    console.error('Promotion unavailable, rendering without it', error)
    cacheLife('minutes')
    return null
  }
}
