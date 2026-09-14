import { createClient, type SanityClient } from '@sanity/client'

export interface SanityClientOptions {
  projectId: string
  dataset: string
  /** Server-only token; omit for public reads. */
  token?: string
  /** Defaults to false: the store relies on Next's cache, not Sanity's CDN. */
  useCdn?: boolean
  /** Sanity API version, YYYY-MM-DD. */
  apiVersion?: string
}

export const DEFAULT_API_VERSION = '2026-09-01'

export function createSanityClient({
  projectId,
  dataset,
  token,
  useCdn = false,
  apiVersion = DEFAULT_API_VERSION,
}: SanityClientOptions): SanityClient {
  return createClient({
    projectId,
    dataset,
    token,
    useCdn,
    apiVersion,
    perspective: 'published',
  })
}
