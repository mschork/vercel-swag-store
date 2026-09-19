import { revalidateTag } from 'next/cache'
import { TAGS } from '@/lib/api/cache'
import { authorised } from '@/lib/bearer'
import { serverEnv } from '@/lib/env'

/**
 * Refreshes the cached catalogue without a redeploy. The Swag Store API sends
 * no webhooks, so an operator (or a cron) calls this after the catalogue
 * changes:
 *
 *   curl -X POST https://<host>/api/revalidate/catalog \
 *     -H "Authorization: Bearer $CATALOG_REVALIDATE_SECRET"
 *
 * The tags expire at once, so the next request for a product, category or
 * the store config reads the API again. Stock, promotions and the cart are
 * never cached and need nothing here.
 */
const CATALOG_TAGS = [TAGS.products, TAGS.categories, TAGS.store] as const

export async function POST(request: Request): Promise<Response> {
  if (!authorised(request.headers.get('authorization'), serverEnv.CATALOG_REVALIDATE_SECRET)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  for (const tag of CATALOG_TAGS) revalidateTag(tag, { expire: 0 })
  return Response.json({ revalidated: CATALOG_TAGS, at: new Date().toISOString() })
}
