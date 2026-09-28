import 'server-only'
import { headers } from 'next/headers'
import { after, userAgent } from 'next/server'
import type { SanityClient } from 'next-sanity'
import { normaliseGap, recordGap } from '@repo/demand'
import { getWriteClient } from '@/lib/sanity/write-client'

/**
 * Counting a search that found nothing, split in two: `gapRecorder` reads the
 * request, and `recordSearchGap` writes, inside `after()`, so the visitor
 * never waits for it. Request APIs are not available inside `after()`, which
 * is why the read comes first.
 *
 * Never cached, and never throws: a lost count is fine, a broken search page
 * is not. Neither the token nor the query is ever logged.
 */

/** A gap this request may count: the write client and the normalised query. */
export interface GapRecording {
  client: SanityClient
  gap: string
}

/**
 * The recording for `query`, or `null`: without a write token, for a bot, or
 * for a query the privacy filters in `normaliseGap` drop. Reads `headers()`.
 */
export async function gapRecorder(query: string): Promise<GapRecording | null> {
  try {
    const client = getWriteClient()
    if (!client) return null
    if (userAgent({ headers: await headers() }).isBot) return null
    const gap = normaliseGap(query)
    return gap ? { client, gap } : null
  } catch (error) {
    console.error('[search-gap]', errorCode(error))
    return null
  }
}

/** Writes the gap. */
export async function recordSearchGap({ client, gap }: GapRecording): Promise<void> {
  try {
    await recordGap(client, gap)
  } catch (error) {
    console.error('[search-gap]', errorCode(error))
  }
}

/**
 * Counts a gap for a caller that already knows the search found nothing.
 * Called from `SearchResults`, which is already the page's dynamic hole, so
 * reading `headers()` here costs the static shell nothing.
 */
export async function recordGapAfterResponse(query: string): Promise<void> {
  const recording = await gapRecorder(query)
  if (recording) after(() => recordSearchGap(recording))
}

/** A status code or an error name: enough to diagnose, nothing a visitor typed. */
function errorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'statusCode' in error) {
    return `status ${String(error.statusCode)}`
  }
  return error instanceof Error ? error.name : 'unknown'
}
