import { timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { TAGS } from '@/lib/api/cache'
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
  const secret = serverEnv.CATALOG_REVALIDATE_SECRET
  if (!secret || !authorised(request.headers.get('authorization'), secret)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  for (const tag of CATALOG_TAGS) revalidateTag(tag, { expire: 0 })
  return Response.json({ revalidated: CATALOG_TAGS, at: new Date().toISOString() })
}

/** Constant-time comparison of an `Authorization: Bearer` header with the secret. */
function authorised(header: string | null, secret: string): boolean {
  if (!header?.startsWith('Bearer ')) return false
  const presented = Buffer.from(header.slice('Bearer '.length))
  const expected = Buffer.from(secret)
  return presented.length === expected.length && timingSafeEqual(presented, expected)
}
