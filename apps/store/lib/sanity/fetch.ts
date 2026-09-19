import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { draftMode } from 'next/headers'
import type { QueryParams } from 'next-sanity'
import { sanityClient } from './client'
import { draftClient } from './draft-client'

/**
 * Every read of Sanity content, cached the same way the catalogue is
 * (AGENTS.md). Tags are `sanity` for everything, `sanity:<type>` per document
 * type and `sanity:<id>` for a single document, which is what the publish
 * webhook expires.
 *
 * The `content` profile is long on purpose: publishing pushes the change, so
 * the timer is a safety net rather than the mechanism
 * (specs/E09-sanity-integration.md).
 *
 * In draft mode (E17) Next skips every cache layer, this one included: the
 * function re-executes on each request and saves nothing, and `isEnabled` may
 * be read inside the cached scope (Next's draft-mode guide). So an editor gets
 * drafts with stega from the token client, and a visitor gets exactly the
 * call below, from the cache. `stega: false` is for callers that feed
 * machines (metadata), where the invisible characters would be exported.
 */
export async function sanityFetch<T>({
  query,
  params = {},
  tags,
  stega = true,
}: {
  query: string
  params?: QueryParams
  tags: string[]
  stega?: boolean
}): Promise<T> {
  'use cache'
  cacheTag('sanity', ...tags)
  cacheLife('content')
  const { isEnabled } = await draftMode()
  if (isEnabled && draftClient) return draftClient.fetch<T>(query, params, { stega })
  return sanityClient.fetch<T>(query, params)
}
