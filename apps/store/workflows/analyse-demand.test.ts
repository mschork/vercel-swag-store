import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The workflow as a plain function: outside the compiler `"use workflow"` and
 * `"use step"` are inert strings, so this checks the orchestration only. The
 * lock against a real runtime is covered by the integration test beside this
 * file.
 */
const mocks = vi.hoisted(() => ({
  conflict: null as { runId: string } | null,
  dispose: vi.fn(),
  sleep: vi.fn(),
  steps: { claim: vi.fn(), catalogue: vi.fn(), propose: vi.fn(), write: vi.fn(), release: vi.fn() },
}))

vi.mock('workflow', () => ({
  createHook: () => ({ getConflict: async () => mocks.conflict, dispose: mocks.dispose }),
  getWorkflowMetadata: () => ({ workflowRunId: 'run1' }),
  sleep: mocks.sleep,
}))
vi.mock('@/lib/demand/steps', () => mocks.steps)

const { analyseDemand } = await import('./analyse-demand')

const gaps = [
  { _id: 'searchGap.a', query: 'umbrella', count: 5 },
  { _id: 'searchGap.b', query: 'asdfgh', count: 2 },
]

beforeEach(() => {
  mocks.conflict = null
  mocks.dispose.mockReset()
  mocks.sleep.mockReset()
  for (const step of Object.values(mocks.steps)) step.mockReset()
  mocks.steps.claim.mockResolvedValue(gaps)
  mocks.steps.catalogue.mockResolvedValue({ products: [], categories: [] })
  mocks.steps.write.mockResolvedValue({ ideas: 1, matched: 0, ignored: 0, released: 1 })
})

describe('analyseDemand', () => {
  it('settles, claims, proposes, validates and writes', async () => {
    mocks.steps.propose.mockResolvedValue({
      clusters: [
        { kind: 'newProduct', gapIds: ['searchGap.a', 'searchGap.zzz'], title: 'Umbrella', rationale: 'r', suggestedCategory: null, match: null },
      ],
    })
    expect(await analyseDemand()).toEqual({ claimed: 2, ideas: 1, matched: 0, ignored: 0, released: 1 })
    expect(mocks.sleep).toHaveBeenCalledWith('10m')
    // The unclaimed id the model invented is gone before anything is written.
    expect(mocks.steps.write).toHaveBeenCalledWith({
      runId: 'run1',
      gaps,
      clusters: [
        { kind: 'newProduct', gapIds: ['searchGap.a'], title: 'Umbrella', rationale: 'r', suggestedCategory: null, match: null },
      ],
      unmentioned: ['searchGap.b'],
    })
    expect(mocks.steps.release).not.toHaveBeenCalled()
    expect(mocks.dispose).toHaveBeenCalledOnce()
  })

  it('turns a second run away while one holds the lock', async () => {
    mocks.conflict = { runId: 'run0' }
    expect(await analyseDemand()).toEqual({ skipped: 'running', heldBy: 'run0' })
    expect(mocks.sleep).not.toHaveBeenCalled()
    expect(mocks.steps.claim).not.toHaveBeenCalled()
  })

  it('skips the wait when asked and stops when nothing is claimed', async () => {
    mocks.steps.claim.mockResolvedValue([])
    expect(await analyseDemand({ settle: false })).toEqual({ claimed: 0, ideas: 0, matched: 0, ignored: 0, released: 0 })
    expect(mocks.sleep).not.toHaveBeenCalled()
    expect(mocks.steps.catalogue).not.toHaveBeenCalled()
  })

  it('releases the gaps and still fails when the model call throws', async () => {
    mocks.steps.propose.mockRejectedValue(new Error('gateway down'))
    await expect(analyseDemand({ settle: false })).rejects.toThrow('gateway down')
    expect(mocks.steps.release).toHaveBeenCalledExactlyOnceWith('run1')
    expect(mocks.steps.write).not.toHaveBeenCalled()
    expect(mocks.dispose).toHaveBeenCalledOnce()
  })
})
