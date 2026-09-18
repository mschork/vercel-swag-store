import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import type { QueryParams } from 'next-sanity'
import { sanityClient } from './client'

/**
 * Every read of Sanity content, cached the same way the catalogue is
 * (AGENTS.md). Tags are `sanity` for everything, `sanity:<type>` per document
 * type and `sanity:<id>` for a single document, which is what the publish
 * webhook expires.
 *
 * The `content` profile is long on purpose: publishing pushes the change, so
 * the timer is a safety net rather than the mechanism
 * (specs/E09-sanity-integration.md).
 */
export async function sanityFetch<T>({
  query,
  params = {},
  tags,
}: {
  query: string
  params?: QueryParams
  tags: string[]
}): Promise<T> {
  'use cache'
  cacheTag('sanity', ...tags)
  cacheLife('content')
  return sanityClient.fetch<T>(query, params)
}
