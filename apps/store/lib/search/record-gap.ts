import 'server-only'
import { headers } from 'next/headers'
import { after, userAgent } from 'next/server'
import { normaliseGap, recordGap } from '@repo/demand'
import { getWriteClient } from '@/lib/sanity/write-client'

/**
 * Counts a search that found nothing (E13), once the response has been sent,
 * so the visitor never waits for it. Called from `SearchResults`, which is
 * already the page's dynamic hole, so reading `headers()` here costs the
 * static shell nothing.
 *
 * Never cached, and never throws: a lost count is fine, a broken search page
 * is not. Neither the token nor the query is ever logged.
 */
export async function recordGapAfterResponse(query: string): Promise<void> {
  try {
    const client = getWriteClient()
    if (!client) return
    // Read before `after()`: request APIs are not available inside it.
    if (userAgent({ headers: await headers() }).isBot) return
    const normalised = normaliseGap(query)
    if (!normalised) return

    after(async () => {
      try {
        await recordGap(client, normalised)
      } catch (error) {
        console.error('[search-gap]', errorCode(error))
      }
    })
  } catch (error) {
    console.error('[search-gap]', errorCode(error))
  }
}

/** A status code or an error name: enough to diagnose, nothing a visitor typed. */
function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    return `status ${String(error.statusCode)}`
  }
  return error instanceof Error ? error.name : 'unknown'
}
