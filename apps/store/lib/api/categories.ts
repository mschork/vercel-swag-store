import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import { z } from 'zod'
import { CATALOG_PROFILE, TAGS } from './cache'
import { fetchApi } from './client'
import { CategorySchema } from './schemas'
import type { Category } from './types'

/** Catalogue data: cached, tagged `categories`, `catalog` lifetime. */
export async function getCategories(): Promise<Category[]> {
  'use cache'
  cacheTag(TAGS.categories)
  cacheLife(CATALOG_PROFILE)
  const { data } = await fetchApi('/categories', { cache: 'cached', schema: z.array(CategorySchema) })
  return data
}

/**
 * One category by slug, or `null` when the API does not list it. Reads the
 * cached list, so it needs no cache entry of its own.
 */
export async function findCategory(slug: string): Promise<Category | null> {
  const categories = await getCategories()
  return categories.find((category) => category.slug === slug) ?? null
}
