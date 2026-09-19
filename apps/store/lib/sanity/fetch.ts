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
 * In draft mode (E17) an editor gets drafts with stega from the token client,
 * uncached, and a visitor gets exactly the cached call below. The branch sits
 * outside the cached function on purpose. Next's draft-mode guide says draft
 * mode skips `"use cache"`, and for a full page load it does; but a
 * `router.refresh()` in draft mode, which is how an edit reaches the page,
 * was answered from the cache when the check lived inside it (E17 slice 3,
 * Next 16.3.5). Reading `draftMode().isEnabled` here does not make a route
 * dynamic: the route table is unchanged. `stega: false` is for callers that
 * feed machines (metadata), where the invisible characters would be exported.
 */
type SanityFetchOptions = {
  query: string
  params?: QueryParams
  tags: string[]
  stega?: boolean
}

export async function sanityFetch<T>({
  query,
  params = {},
  tags,
  stega = true,
}: SanityFetchOptions): Promise<T> {
  const { isEnabled } = await draftMode()
  if (isEnabled && draftClient) return draftClient.fetch<T>(query, params, { stega })
  return cachedFetch<T>(query, params, tags)
}

/** Exactly the call visitors have always had; `stega` is not part of its key. */
async function cachedFetch<T>(query: string, params: QueryParams, tags: string[]): Promise<T> {
  'use cache'
  cacheTag('sanity', ...tags)
  cacheLife('content')
  return sanityClient.fetch<T>(query, params)
}
