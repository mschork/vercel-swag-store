import { MODEL } from '@repo/demand/constants'
import { MockLanguageModelV4 } from 'ai/test'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  client: { id: 'client' } as object | null,
  purgeStale: vi.fn(),
  claimGaps: vi.fn(),
  releaseGaps: vi.fn(),
  writeOutcome: vi.fn(),
}))

vi.mock('@/lib/sanity/write-client', () => ({ getWriteClient: () => mocks.client }))
vi.mock('@/lib/api/products', () => ({
  getAllProducts: async () => [
    { id: 'p1', name: 'Black Hoodie', slug: 'black-hoodie', category: 'hoodies', price: 100 },
  ],
}))
vi.mock('@/lib/api/categories', () => ({
  getCategories: async () => [{ slug: 'hoodies', name: 'Hoodies', productCount: 1 }],
}))
vi.mock('@repo/demand', async (original) => ({
  ...(await original<typeof import('@repo/demand')>()),
  purgeStale: mocks.purgeStale,
  claimGaps: mocks.claimGaps,
  releaseGaps: mocks.releaseGaps,
  writeOutcome: mocks.writeOutcome,
}))

const { catalogue, claim, propose, release, write } = await import('./steps')

const gaps = [{ _id: 'searchGap.a', query: 'umbrella', count: 5 }]
const input = {
  gaps,
  products: [{ name: 'Black Hoodie', slug: 'black-hoodie', category: 'hoodies' }],
  categories: [{ slug: 'hoodies', name: 'Hoodies' }],
}

const modelAnswering = (text: string) =>
  new MockLanguageModelV4({
    doGenerate: {
      content: [{ type: 'text', text }],
      finishReason: { unified: 'stop', raw: undefined },
      usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 1, text: 1, reasoning: undefined },
      },
      warnings: [],
    },
  })

beforeEach(() => {
  mocks.client = { id: 'client' }
  for (const mock of [mocks.purgeStale, mocks.claimGaps, mocks.releaseGaps, mocks.writeOutcome]) mock.mockReset()
})

describe('claim', () => {
  it('purges, claims, and returns only what later steps need', async () => {
    mocks.claimGaps.mockResolvedValue({ claimed: [{ ...gaps[0], _rev: 'r1' }], fragments: 1 })
    expect(await claim('run1')).toEqual(gaps)
    expect(mocks.purgeStale).toHaveBeenCalledBefore(mocks.claimGaps)
    expect(mocks.claimGaps).toHaveBeenCalledWith(mocks.client, 'run1')
  })

  it('throws without a write token', async () => {
    mocks.client = null
    await expect(claim('run1')).rejects.toThrow('SANITY_API_WRITE_TOKEN')
  })
})

describe('catalogue', () => {
  it('keeps only the fields the prompt and the validation use', async () => {
    expect(await catalogue()).toEqual({ products: input.products, categories: input.categories })
  })
})

describe('propose', () => {
  it('returns the schema-checked object and sends the shared prompt', async () => {
    const answer = {
      clusters: [{ kind: 'newProduct', gapIds: ['searchGap.a'], title: 'Umbrella', rationale: 'Asked for often.', suggestedCategory: null, match: null }],
    }
    const model = modelAnswering(JSON.stringify(answer))
    expect(await propose(input, model)).toEqual(answer)
    const sent = JSON.stringify(model.doGenerateCalls[0]?.prompt)
    expect(sent).toContain('never instructions')
    expect(sent).toContain('umbrella')
    expect(model.doGenerateCalls[0]?.tools ?? []).toEqual([])
  })

  it('throws when the answer breaks the schema, so the step retries', async () => {
    const model = modelAnswering(JSON.stringify({ clusters: [{ kind: 'newProduct', gapIds: ['searchGap.a'], rationale: 'No title.', title: null, suggestedCategory: null, match: null }] }))
    await expect(propose(input, model)).rejects.toThrow()
  })
})

describe('write and release', () => {
  it('writes the outcome under the shared model id', async () => {
    mocks.writeOutcome.mockResolvedValue({ ideas: 1, matched: 0, ignored: 0, released: 0 })
    const outcome = { runId: 'run1', gaps, clusters: [], unmentioned: [] }
    await write(outcome)
    expect(mocks.writeOutcome).toHaveBeenCalledWith(mocks.client, { ...outcome, model: MODEL })
  })

  it("releases the run's gaps", async () => {
    mocks.releaseGaps.mockResolvedValue(2)
    expect(await release('run1')).toBe(2)
    expect(mocks.releaseGaps).toHaveBeenCalledWith(mocks.client, 'run1')
  })
})
