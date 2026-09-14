import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { CATALOG_PROFILE, TAGS } from './cache'
import { fetchApi } from './client'
import { HealthSchema, StoreConfigSchema } from './schemas'
import type { Health, StoreConfig } from './types'

/** Catalogue data: cached, tagged `store`, `catalog` lifetime. */
export async function getStoreConfig(): Promise<StoreConfig> {
  'use cache'
  cacheTag(TAGS.store)
  cacheLife(CATALOG_PROFILE)
  const { data } = await fetchApi('/store/config', { schema: StoreConfigSchema })
  return data
}

/**
 * Not cached: a health check that is served from cache reports nothing.
 * Used by the opt-in integration test; no page renders it (see specs/callout.md).
 */
export async function getHealth(): Promise<Health> {
  const { data } = await fetchApi('/health', { schema: HealthSchema })
  return data
}
