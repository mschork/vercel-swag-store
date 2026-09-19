import { describe, expect, it } from 'vitest'
import { fakeClient } from './fake-client.ts'
import { gapId, ideaId } from './ids.ts'
import { applyDecision, claimGaps, purgeStale, recordGap, releaseGaps, writeOutcome } from './store.ts'

const NOW = new Date('2026-09-19T12:00:00.000Z')
const minutesAgo = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000).toISOString()

describe('recordGap', () => {
  it('creates a gap on first sight and counts it once', async () => {
    const { client, commits } = fakeClient([{ gap: null, open: 0 }])
    expect(await recordGap(client, 'umbrella', NOW)).toBe('recorded')
    const id = gapId('umbrella')
    expect(commits).toEqual([
      [
        {
          op: 'createIfNotExists',
          doc: {
            _id: id,
            _type: 'searchGap',
            query: 'umbrella',
            count: 0,
            status: 'new',
            firstSeen: NOW.toISOString(),
            lastSeen: NOW.toISOString(),
          },
        },
        { op: 'patch', id, set: { lastSeen: NOW.toISOString() }, inc: { count: 1 } },
      ],
    ])
  })

  it('writes nothing inside the dedupe window', async () => {
    const { client, commits } = fakeClient([{ gap: { lastSeen: minutesAgo(9), status: 'new' }, open: 1 }])
    expect(await recordGap(client, 'umbrella', NOW)).toBe('deduped')
    expect(commits).toEqual([])
  })

  it('counts again past the dedupe window', async () => {
    const { client, commits } = fakeClient([{ gap: { lastSeen: minutesAgo(11), status: 'new' }, open: 1 }])
    expect(await recordGap(client, 'umbrella', NOW)).toBe('recorded')
    expect(commits).toHaveLength(1)
  })

  it('creates no new gap at the open-gap cap, but still counts a known one', async () => {
    const capped = fakeClient([{ gap: null, open: 500 }])
    expect(await recordGap(capped.client, 'umbrella', NOW)).toBe('capped')
    expect(capped.commits).toEqual([])

    const known = fakeClient([{ gap: { lastSeen: minutesAgo(30), status: 'new' }, open: 500 }])
    expect(await recordGap(known.client, 'umbrella', NOW)).toBe('recorded')
  })

  it('leaves an ignored gap alone and keeps counting a reviewed one', async () => {
    const ignored = fakeClient([{ gap: { lastSeen: minutesAgo(60), status: 'ignored' }, open: 0 }])
    expect(await recordGap(ignored.client, 'asdfgh', NOW)).toBe('ignored')
    expect(ignored.commits).toEqual([])

    const reviewed = fakeClient([{ gap: { lastSeen: minutesAgo(60), status: 'reviewed' }, open: 0 }])
    expect(await recordGap(reviewed.client, 'umbrella', NOW)).toBe('recorded')
    expect(reviewed.commits[0]?.[1]).not.toHaveProperty('set.status')
  })
})

describe('purgeStale', () => {
  it('deletes quiet gaps under the threshold', async () => {
    const { client, deletes } = fakeClient([])
    await purgeStale(client, NOW)
    expect(deletes[0]).toMatchObject({
      params: { type: 'searchGap', threshold: 2, cutoff: '2026-08-20T12:00:00.000Z' },
    })
  })
})

describe('claimGaps', () => {
  const open = [
    { _id: 'a', _rev: 'ra', query: 'umbrella', count: 5 },
    { _id: 'b', _rev: 'rb', query: 'hodie', count: 4 },
    { _id: 'c', _rev: 'rc', query: 'umb', count: 2 },
    { _id: 'd', _rev: 'rd', query: 'umbre', count: 1 },
    { _id: 'e', _rev: 're', query: 'scarf', count: 1 },
  ]

  it('claims gaps at the threshold and settles their typing fragments', async () => {
    const { client, commits } = fakeClient([open])
    const { claimed, fragments } = await claimGaps(client, 'run1')
    expect(claimed.map((g) => g._id)).toEqual(['a', 'b'])
    expect(fragments).toBe(2)
    expect(commits[0]).toEqual([
      { op: 'patch', id: 'c', ifRevisionId: 'rc', set: { status: 'ignored', note: 'typing fragment of umbrella', runId: 'run1' } },
      { op: 'patch', id: 'd', ifRevisionId: 'rd', set: { status: 'ignored', note: 'typing fragment of umbrella', runId: 'run1' } },
      { op: 'patch', id: 'a', ifRevisionId: 'ra', set: { status: 'analysing', runId: 'run1' } },
      { op: 'patch', id: 'b', ifRevisionId: 'rb', set: { status: 'analysing', runId: 'run1' } },
    ])
  })

  it('writes nothing when no gap has reached the threshold', async () => {
    const { client, commits } = fakeClient([[open[4]]])
    expect(await claimGaps(client, 'run1')).toEqual({ claimed: [], fragments: 0 })
    expect(commits).toEqual([])
  })

  it('throws when a revision moved, so the caller retries', async () => {
    const { client } = fakeClient([open], { failCommit: new Error('409') })
    await expect(claimGaps(client, 'run1')).rejects.toThrow('409')
  })
})

describe('releaseGaps', () => {
  it("puts the run's gaps back to new", async () => {
    const { client, commits } = fakeClient([['a', 'b']])
    expect(await releaseGaps(client, 'run1')).toBe(2)
    expect(commits[0]).toEqual([
      { op: 'patch', id: 'a', set: { status: 'new' }, unset: ['runId'] },
      { op: 'patch', id: 'b', set: { status: 'new' }, unset: ['runId'] },
    ])
  })

  it('writes nothing when the run holds no gap', async () => {
    const { client, commits } = fakeClient([[]])
    expect(await releaseGaps(client, 'run1')).toBe(0)
    expect(commits).toEqual([])
  })
})

describe('writeOutcome', () => {
  it('creates ideas and settles every claimed gap in one transaction', async () => {
    const { client, commits } = fakeClient([])
    const result = await writeOutcome(client, {
      runId: 'run1',
      model: 'test/model',
      now: NOW,
      gaps: [
        { _id: 'searchGap.a', count: 5 },
        { _id: 'searchGap.b', count: 3 },
        { _id: 'searchGap.c', count: 4 },
        { _id: 'searchGap.d', count: 2 },
        { _id: 'searchGap.e', count: 2 },
      ],
      clusters: [
        { kind: 'newProduct', gapIds: ['searchGap.a', 'searchGap.b'], title: 'Umbrella', rationale: 'Rain.', suggestedCategory: 'accessories' },
        { kind: 'alreadySold', gapIds: ['searchGap.c'], rationale: 'Typo of hoodie.', match: 'hoodies' },
        { kind: 'noise', gapIds: ['searchGap.d'], rationale: 'Gibberish.' },
      ],
      unmentioned: ['searchGap.e'],
    })

    expect(result).toEqual({ ideas: 1, matched: 1, ignored: 1, released: 1 })
    expect(commits).toHaveLength(1)
    expect(commits[0]).toEqual([
      {
        op: 'createIfNotExists',
        doc: {
          _id: ideaId(['searchGap.a', 'searchGap.b']),
          _type: 'productIdea',
          title: 'Umbrella',
          rationale: 'Rain.',
          suggestedCategory: { _type: 'reference', _ref: 'category-accessories', _weak: true },
          sourceGaps: [
            { _type: 'reference', _key: 'searchGap-a', _ref: 'searchGap.a', _weak: true },
            { _type: 'reference', _key: 'searchGap-b', _ref: 'searchGap.b', _weak: true },
          ],
          estimatedDemand: 8,
          status: 'proposed',
          generatedBy: 'test/model',
          generatedAt: NOW.toISOString(),
          runId: 'run1',
        },
      },
      { op: 'patch', id: 'searchGap.a', set: { status: 'reviewed' } },
      { op: 'patch', id: 'searchGap.b', set: { status: 'reviewed' } },
      { op: 'patch', id: 'searchGap.c', set: { status: 'matched', note: 'hoodies: Typo of hoodie.' } },
      { op: 'patch', id: 'searchGap.d', set: { status: 'ignored', note: 'Gibberish.' } },
      { op: 'patch', id: 'searchGap.e', set: { status: 'new' }, unset: ['runId'] },
    ])
  })
})

describe('applyDecision', () => {
  it('accepts an idea and promotes the gaps that still exist', async () => {
    const { client, commits } = fakeClient([{ status: 'proposed', gapIds: ['g1', 'g2'] }, ['g1']])
    expect(await applyDecision(client, { ideaId: 'productIdea.x', decision: 'accepted', now: NOW })).toBe('applied')
    expect(commits[0]).toEqual([
      { op: 'patch', id: 'productIdea.x', set: { status: 'accepted', decidedAt: NOW.toISOString() } },
      { op: 'patch', id: 'g1', set: { status: 'promoted' } },
    ])
  })

  it('rejects with a reason and leaves the gaps reviewed', async () => {
    const { client, commits } = fakeClient([{ status: 'proposed', gapIds: ['g1'] }])
    await applyDecision(client, { ideaId: 'productIdea.x', decision: 'rejected', reason: 'Too seasonal.', now: NOW })
    expect(commits[0]).toEqual([
      {
        op: 'patch',
        id: 'productIdea.x',
        set: { status: 'rejected', decidedAt: NOW.toISOString(), rejectionReason: 'Too seasonal.' },
      },
    ])
  })

  it('writes once when the same decision is delivered twice', async () => {
    const { client, commits } = fakeClient([{ status: 'proposed', gapIds: [] }, [], { status: 'accepted', gapIds: [] }])
    expect(await applyDecision(client, { ideaId: 'productIdea.x', decision: 'accepted' })).toBe('applied')
    expect(await applyDecision(client, { ideaId: 'productIdea.x', decision: 'accepted' })).toBe('already')
    expect(commits).toHaveLength(1)
  })

  it('throws for an idea that does not exist', async () => {
    const { client } = fakeClient([null])
    await expect(applyDecision(client, { ideaId: 'productIdea.x', decision: 'accepted' })).rejects.toThrow('No product idea')
  })
})
