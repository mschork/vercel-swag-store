import { documentEventHandler } from '@sanity/functions'

/**
 * Wakes the demand analysis when a search gap matters. The blueprint's filter
 * decides when: a `new` gap whose count just changed and has reached the
 * threshold. This handler only makes the call.
 *
 * It fires on every increment past the threshold, so a lost call is made again
 * on the next search, and the workflow's lock absorbs the extra calls.
 * Read-only, so its own run cannot match the filter.
 *
 * `STORE_URL` and `DEMAND_ANALYSE_SECRET` are set with
 * `sanity functions env add gap-threshold <KEY> <value>`, never in the
 * blueprint, which is in git.
 */
export const handler = documentEventHandler<{ _id: string }>(async ({ context, event }) => {
  if (context.local) {
    console.log(`[gap-threshold] local run for ${event.data._id}: would POST /api/demand/analyse`)
    return
  }
  await wakeAnalysis(process.env.STORE_URL, process.env.DEMAND_ANALYSE_SECRET)
  console.log(`[gap-threshold] analysis requested after ${event.data._id}`)
})

/** Throws on anything but a 2xx, so a failure shows in `sanity functions logs`. The secret is never logged. */
export async function wakeAnalysis(storeUrl: string | undefined, secret: string | undefined): Promise<void> {
  if (!storeUrl || !secret) throw new Error('STORE_URL and DEMAND_ANALYSE_SECRET must be set on the function.')
  const response = await fetch(new URL('/api/demand/analyse', storeUrl), {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
    body: JSON.stringify({ settle: true }),
  })
  if (!response.ok) throw new Error(`The store answered ${response.status} to the analysis request.`)
}
