import { waitForSleep } from '@workflow/vitest'
import { describe, expect, it } from 'vitest'
import { start } from 'workflow/api'
import { analyseDemand } from './analyse-demand'

/**
 * The lock against the real runtime (E13). A burst of calls from the
 * `gap-threshold` Function must collapse into one analysis, and the lock must
 * be free again once that run is over.
 *
 * Every run here is caught in its settle sleep and then cancelled, so no step
 * executes and nothing reaches Sanity or a model.
 */
describe('analyseDemand lock', () => {
  it('turns a second run away while one holds the lock, and frees the lock when that run ends', async () => {
    const first = await start(analyseDemand, [{ settle: true }])
    // Asleep in `sleep(SETTLE)` means past `getConflict()`: it holds the lock.
    await waitForSleep(first)

    const second = await start(analyseDemand, [{ settle: true }])
    await expect(second.returnValue).resolves.toEqual({ skipped: 'running', heldBy: first.runId })

    await first.cancel()

    const third = await start(analyseDemand, [{ settle: true }])
    // Reaching the sleep proves it was not turned away: the lock was free.
    await waitForSleep(third)
    await third.cancel()
  })
})
