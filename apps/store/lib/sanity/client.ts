import 'server-only'
import { createClient } from 'next-sanity'
import { publicEnv } from '@/lib/env.public'

/**
 * The Sanity client. No token: the dataset is public (specs/decisions.md), so
 * a missing secret can never break a build. `useCdn: false` because Next's
 * cache is the only cache this store relies on.
 */
export const sanityClient = createClient({
  projectId: publicEnv.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: publicEnv.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2026-09-01',
  useCdn: false,
  perspective: 'published',
})
