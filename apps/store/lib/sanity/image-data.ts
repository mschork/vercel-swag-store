import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'

/**
 * A Sanity image as a data URI, for `next/og`. The renderer would download a
 * URL itself, outside any cache, which makes the image route dynamic. An asset
 * URL never changes its bytes, so the entry is keyed by the URL and expires
 * with the `sanity` tag like every other read.
 */
export async function sanityImageDataUri(url: string): Promise<string> {
  'use cache'
  cacheTag('sanity')
  cacheLife('content')
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Sanity image ${response.status}: ${url}`)
  const type = response.headers.get('content-type') ?? 'image/jpeg'
  const bytes = Buffer.from(await response.arrayBuffer())
  return `data:${type};base64,${bytes.toString('base64')}`
}
