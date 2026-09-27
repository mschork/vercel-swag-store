import { REVIEW_HOOK_PREFIX } from '@repo/testimonials/constants'
import { waitForSleep } from '@workflow/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resumeHook, start } from 'workflow/api'
import { HookNotFoundError } from 'workflow/errors'
import { testimonial } from './testimonial'

const emptyCatalogue = {
  success: true,
  data: [],
  meta: {
    pagination: { page: 1, limit: 100, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
  },
}

afterEach(() => vi.unstubAllGlobals())

/**
 * The review hook against the real runtime. A run creates it when it starts,
 * so a decision can never arrive before the hook exists. The run is caught
 * waiting for its first message and cancelled: no model is called, and the
 * catalogue, its only step so far, comes from a stubbed `fetch`.
 */
describe('testimonial review hook', () => {
  it('exists from the start of a run, and an unknown run has none', async () => {
    const realFetch = globalThis.fetch
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
      String(input instanceof Request ? input.url : input).includes('/products?')
        ? Promise.resolve(Response.json(emptyCatalogue))
        : realFetch(input, init),
    )
    const run = await start(testimonial, [null])
    // Asleep in the idle race means past the hooks' creation.
    await waitForSleep(run)
    await expect(
      resumeHook(`${REVIEW_HOOK_PREFIX}${run.runId}`, { status: 'rejected', rejectionReason: 'other' }),
    ).resolves.toMatchObject({ runId: run.runId })
    await run.cancel()

    const missing = await resumeHook(`${REVIEW_HOOK_PREFIX}wrun_none`, {}).catch((error: unknown) => error)
    expect(HookNotFoundError.is(missing)).toBe(true)
  })
})
