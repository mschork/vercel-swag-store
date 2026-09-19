import type { SanityClient } from '@sanity/client'
import {
  ANALYSE_THRESHOLD,
  DEDUPE_MINUTES,
  GAP_TYPE,
  IDEA_TYPE,
  MAX_GAPS_PER_RUN,
  MAX_OPEN_GAPS,
  RETENTION_DAYS,
  type GapStatus,
  type IdeaStatus,
} from './constants.ts'
import { typingFragments } from './fragments.ts'
import { gapId, ideaId } from './ids.ts'
import type { Cluster } from './model-schema.ts'

/**
 * Every read and write of the loop's documents, over a client the caller
 * builds: the store (token from its env), a Sanity Function (`context.clientOptions`)
 * or E14's agent. GROQ for these types lives here and nowhere else.
 */
export type DemandClient = Pick<SanityClient, 'fetch' | 'transaction' | 'delete'>

export interface Gap {
  _id: string
  _rev: string
  query: string
  count: number
}

export interface GapState {
  gap: { lastSeen: string; status: GapStatus } | null
  open: number
}

export type RecordResult = 'recorded' | 'deduped' | 'capped' | 'ignored'

const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

export function readGapState(client: DemandClient, id: string): Promise<GapState> {
  return client.fetch<GapState>(
    `{
      "gap": *[_id == $id][0]{ lastSeen, status },
      "open": count(*[_type == $type && status == "new"])
    }`,
    { id, type: GAP_TYPE },
  )
}

/**
 * One read, at most one write. The read-then-write is not atomic: two
 * instances racing inside the same second can both increment, which a demand
 * counter tolerates.
 */
export async function recordGap(
  client: DemandClient,
  normalised: string,
  now: Date = new Date(),
): Promise<RecordResult> {
  const id = gapId(normalised)
  const { gap, open } = await readGapState(client, id)

  if (gap?.status === 'ignored') return 'ignored'
  if (gap && now.getTime() - Date.parse(gap.lastSeen) < DEDUPE_MINUTES * MINUTE) return 'deduped'
  if (!gap && open >= MAX_OPEN_GAPS) return 'capped'

  const at = now.toISOString()
  await client
    .transaction()
    .createIfNotExists({
      _id: id,
      _type: GAP_TYPE,
      query: normalised,
      count: 0,
      status: 'new',
      firstSeen: at,
      lastSeen: at,
    })
    .patch(id, (patch) => patch.set({ lastSeen: at }).inc({ count: 1 }))
    .commit()
  return 'recorded'
}

/** Deletes gaps that never reached the threshold and have gone quiet. */
export async function purgeStale(client: DemandClient, now: Date = new Date()): Promise<void> {
  await client.delete({
    query: `*[_type == $type && status == "new" && count < $threshold && lastSeen < $cutoff]`,
    params: {
      type: GAP_TYPE,
      threshold: ANALYSE_THRESHOLD,
      cutoff: new Date(now.getTime() - RETENTION_DAYS * DAY).toISOString(),
    },
  })
}

/**
 * Takes the gaps worth analysing for one run. Typing fragments of a claimed
 * gap are settled here (`ignored`), the rest become `analysing` under the run
 * id. Every patch is guarded by the revision that was read, so a search that
 * lands in between fails the transaction and the caller's retry reads again.
 */
export async function claimGaps(
  client: DemandClient,
  runId: string,
): Promise<{ claimed: Gap[]; fragments: number }> {
  const open = await client.fetch<Gap[]>(
    `*[_type == $type && status == "new"] | order(count desc, lastSeen desc) [0...$cap]{ _id, _rev, query, count }`,
    { type: GAP_TYPE, cap: MAX_OPEN_GAPS },
  )
  const candidates = open.filter((gap) => gap.count >= ANALYSE_THRESHOLD).slice(0, MAX_GAPS_PER_RUN)
  if (candidates.length === 0) return { claimed: [], fragments: 0 }

  const candidateQueries = new Set(candidates.map((gap) => gap.query))
  const fragments = new Map(
    [...typingFragments(open)].filter(([, whole]) => candidateQueries.has(whole)),
  )
  const claimed = candidates.filter((gap) => !fragments.has(gap._id))

  const transaction = client.transaction()
  for (const gap of open) {
    const whole = fragments.get(gap._id)
    if (whole) {
      transaction.patch(gap._id, (patch) =>
        patch.ifRevisionId(gap._rev).set({ status: 'ignored', note: `typing fragment of ${whole}`, runId }),
      )
    }
  }
  for (const gap of claimed) {
    transaction.patch(gap._id, (patch) => patch.ifRevisionId(gap._rev).set({ status: 'analysing', runId }))
  }
  await transaction.commit()
  return { claimed, fragments: fragments.size }
}

/** Puts a failed run's gaps back, so no gap is ever stuck in `analysing`. */
export async function releaseGaps(client: DemandClient, runId: string): Promise<number> {
  const ids = await client.fetch<string[]>(
    `*[_type == $type && status == "analysing" && runId == $runId]._id`,
    { type: GAP_TYPE, runId },
  )
  if (ids.length === 0) return 0
  const transaction = client.transaction()
  for (const id of ids) transaction.patch(id, (patch) => patch.set({ status: 'new' }).unset(['runId']))
  await transaction.commit()
  return ids.length
}

export interface Outcome {
  runId: string
  model: string
  gaps: readonly Pick<Gap, '_id' | 'count'>[]
  clusters: readonly Cluster[]
  unmentioned: readonly string[]
  now?: Date
}

export interface OutcomeCounts {
  ideas: number
  matched: number
  ignored: number
  released: number
}

/** One transaction for the whole run: ideas created, every claimed gap settled. */
export async function writeOutcome(client: DemandClient, outcome: Outcome): Promise<OutcomeCounts> {
  const at = (outcome.now ?? new Date()).toISOString()
  const counts = new Map(outcome.gaps.map((gap) => [gap._id, gap.count]))
  const result: OutcomeCounts = { ideas: 0, matched: 0, ignored: 0, released: outcome.unmentioned.length }
  const transaction = client.transaction()
  const settle = (ids: readonly string[], status: GapStatus, note?: string) => {
    for (const id of ids) {
      transaction.patch(id, (patch) => (note ? patch.set({ status, note }) : patch.set({ status })))
    }
  }

  for (const cluster of outcome.clusters) {
    if (cluster.kind === 'newProduct') {
      transaction.createIfNotExists({
        _id: ideaId(cluster.gapIds),
        _type: IDEA_TYPE,
        title: cluster.title,
        rationale: cluster.rationale,
        ...(cluster.suggestedCategory && {
          suggestedCategory: { _type: 'reference', _ref: `category-${cluster.suggestedCategory}`, _weak: true },
        }),
        sourceGaps: cluster.gapIds.map((id) => ({ _type: 'reference', _key: id.replace('.', '-'), _ref: id, _weak: true })),
        estimatedDemand: cluster.gapIds.reduce((sum, id) => sum + (counts.get(id) ?? 0), 0),
        status: 'proposed' satisfies IdeaStatus,
        generatedBy: outcome.model,
        generatedAt: at,
        runId: outcome.runId,
      })
      settle(cluster.gapIds, 'reviewed')
      result.ideas += 1
    } else if (cluster.kind === 'alreadySold') {
      settle(cluster.gapIds, 'matched', `${cluster.match}: ${cluster.rationale}`)
      result.matched += cluster.gapIds.length
    } else {
      settle(cluster.gapIds, 'ignored', cluster.rationale)
      result.ignored += cluster.gapIds.length
    }
  }
  for (const id of outcome.unmentioned) {
    transaction.patch(id, (patch) => patch.set({ status: 'new' }).unset(['runId']))
  }
  await transaction.commit()
  return result
}

export interface Decision {
  ideaId: string
  decision: Exclude<IdeaStatus, 'proposed'>
  reason?: string
  now?: Date
}

/**
 * An editor's decision. Delivery is at least once, so a decision that is
 * already on the idea writes nothing. Accepting promotes the source gaps;
 * rejecting leaves them `reviewed`.
 */
export async function applyDecision(client: DemandClient, decision: Decision): Promise<'applied' | 'already'> {
  const idea = await client.fetch<{ status: IdeaStatus; gapIds: string[] } | null>(
    `*[_id == $id][0]{ status, "gapIds": sourceGaps[]._ref }`,
    { id: decision.ideaId },
  )
  if (!idea) throw new Error(`No product idea ${decision.ideaId}`)
  if (idea.status !== 'proposed') return 'already'

  const transaction = client.transaction().patch(decision.ideaId, (patch) =>
    patch.set({
      status: decision.decision,
      decidedAt: (decision.now ?? new Date()).toISOString(),
      ...(decision.decision === 'rejected' && decision.reason && { rejectionReason: decision.reason }),
    }),
  )
  if (decision.decision === 'accepted') {
    // A gap may have been deleted by retention; the references are weak.
    const existing = await client.fetch<string[]>(`*[_id in $ids]._id`, { ids: idea.gapIds ?? [] })
    for (const id of existing) transaction.patch(id, (patch) => patch.set({ status: 'promoted' }))
  }
  await transaction.commit()
  return 'applied'
}
