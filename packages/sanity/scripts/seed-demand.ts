import { createClient } from '@sanity/client'
import { gapId, normaliseGap } from '@repo/demand'
import { required } from './env.ts'

/**
 * Six search gaps, so the analysis and the review (E13 slices 3 to 5) can be
 * developed without searching by hand: three that cluster, a typo, a typing
 * fragment and gibberish. Never part of `seed`; idempotent, and it leaves a
 * gap that already exists alone.
 *
 * Run with `pnpm --filter @repo/sanity seed-demand`.
 */
const GAPS: [query: string, count: number][] = [
  ['umbrella', 5],
  ['umbrellas', 3],
  ['rain umbrella', 2],
  ['hodie', 4],
  ['umb', 2],
  ['asdfgh', 2],
]

const client = createClient({
  projectId: required('NEXT_PUBLIC_SANITY_PROJECT_ID'),
  dataset: required('NEXT_PUBLIC_SANITY_DATASET'),
  token: required('SANITY_API_WRITE_TOKEN'),
  apiVersion: '2026-09-01',
  useCdn: false,
})

const now = new Date().toISOString()
const transaction = client.transaction()
for (const [raw, count] of GAPS) {
  const query = normaliseGap(raw)
  if (!query) throw new Error(`The seed query "${raw}" does not survive normalisation.`)
  transaction.createIfNotExists({
    _id: gapId(query),
    _type: 'searchGap',
    query,
    count,
    status: 'new',
    firstSeen: now,
    lastSeen: now,
  })
}
await transaction.commit()
console.log(`Seeded ${GAPS.length} search gaps (existing ones left alone).`)
