import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { draftMode } from 'next/headers'
import type { QueryParams } from 'next-sanity'
import { sanityClient } from './client'
import { draftClient } from './draft-client'

/**
 * Every read of Sanity content. Tags are `sanity` for everything,
 * `sanity:<type>` per document type and `sanity:<id>` for a single document,
 * which is what the publish webhook expires; the `content` lifetime is a
 * safety net behind the webhook. In draft mode an editor gets drafts with
 * stega, uncached. That branch sits outside the cached function because a
 * `router.refresh()` in draft mode is answered from the cache when the check
 * lives inside it (Next 16.3.5). `stega: false` is for callers that feed
 * machines, where the invisible characters would be exported.
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

/** The call a visitor gets; `stega` is not part of its key. */
async function cachedFetch<T>(query: string, params: QueryParams, tags: string[]): Promise<T> {
  'use cache'
  cacheTag('sanity', ...tags)
  cacheLife('content')
  return sanityClient.fetch<T>(query, params)
}
