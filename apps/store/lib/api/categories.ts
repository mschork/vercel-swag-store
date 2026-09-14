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
  const { data } = await fetchApi('/categories', { schema: z.array(CategorySchema) })
  return data
}
