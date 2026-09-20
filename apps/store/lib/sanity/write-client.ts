import 'server-only'
import { createClient, type SanityClient } from 'next-sanity'
import { serverEnv } from '@/lib/env'
import { publicEnv } from '@/lib/env.public'

/**
 * The one Sanity client that can write, used only by the search-gap loop.
 * Never cached, never imported by a component. `null` when the token is unset,
 * so previews, CI and forks record nothing.
 */
export function getWriteClient(): SanityClient | null {
  const token = serverEnv.SANITY_API_WRITE_TOKEN
  if (!token) return null
  return createClient({
    projectId: publicEnv.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: publicEnv.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: '2026-09-01',
    useCdn: false,
    token,
  })
}
