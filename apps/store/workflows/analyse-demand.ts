import { createHook, getWorkflowMetadata, sleep } from 'workflow'
// Subpaths, not the package root: the workflow body runs in a sandbox without
// Node built-ins, and the root pulls in `node:crypto`.
import { SETTLE } from '@repo/demand/constants'
import { validateClusters } from '@repo/demand/validate'
import * as steps from '@/lib/demand/steps'

/**
 * Failed searches into product ideas (specs/E13-search-gap-loop.md, slice 3),
 * as durable steps: a crash or a redeploy resumes where it stopped, and each
 * step retries on its own. Started only by POST /api/demand/analyse.
 */

/** One token for every run, so it works as a lock. */
const LOCK = 'demand-analysis'

export type AnalysisResult =
  | { skipped: 'running'; heldBy: string }
  | { claimed: number; ideas: number; matched: number; ignored: number; released: number }

async function claim(runId: string) {
  'use step'
  return steps.claim(runId)
}
async function catalogue() {
  'use step'
  return steps.catalogue()
}
async function propose(input: Parameters<typeof steps.propose>[0]) {
  'use step'
  return steps.propose(input)
}
async function write(outcome: Parameters<typeof steps.write>[0]) {
  'use step'
  return steps.write(outcome)
}
async function release(runId: string) {
  'use step'
  return steps.release(runId)
}

export async function analyseDemand({ settle = true }: { settle?: boolean } = {}): Promise<AnalysisResult> {
  'use workflow'
  const lock = createHook({ token: LOCK })
  try {
    // A burst of Function calls collapses into the run that holds the lock.
    const conflict = await lock.getConflict()
    if (conflict) return { skipped: 'running', heldBy: conflict.runId }

    // Lets sibling queries, and the rest of someone's typing, arrive.
    if (settle) await sleep(SETTLE)

    const { workflowRunId: runId } = getWorkflowMetadata()
    const gaps = await claim(runId)
    if (gaps.length === 0) return { claimed: 0, ideas: 0, matched: 0, ignored: 0, released: 0 }

    try {
      const { products, categories } = await catalogue()
      const output = await propose({ gaps, products, categories })
      const { clusters, unmentioned } = validateClusters(output, {
        gapIds: gaps.map((gap) => gap._id),
        products,
        categories,
      })
      const counts = await write({ runId, gaps, clusters, unmentioned })
      return { claimed: gaps.length, ...counts }
    } catch (error) {
      // No gap is ever left in `analysing`; the run still shows as failed.
      await release(runId)
      throw error
    }
  } finally {
    lock.dispose()
  }
}
