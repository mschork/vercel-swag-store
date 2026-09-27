import { documentEventHandler } from '@sanity/functions'

/**
 * Hands an editor's decision on a testimonial submission to the store's run
 * that waits for it. The Studio's Accept and Reject actions set the status;
 * the blueprint's filter fires this when it changes to `accepted` or
 * `rejected`. It only makes the call and writes nothing, so it cannot
 * trigger itself.
 *
 * `STORE_URL` and `TESTIMONIAL_DECISION_SECRET` are set with
 * `sanity functions env add submission-decided <KEY> <value>`, never in the
 * blueprint, which is in git.
 */
export interface SubmissionDecision {
  _id: string
  runId: string
  status: string
  rejectionReason: string | null
  photoAlt: string | null
}

export const handler = documentEventHandler<SubmissionDecision>(async ({ context, event }) => {
  const decision = event.data
  if (context.local) {
    console.log(`[submission-decided] local run: would POST "${decision.status}" for ${decision._id}`)
    return
  }
  const outcome = await postDecision(process.env.STORE_URL, process.env.TESTIMONIAL_DECISION_SECRET, decision)
  console.log(`[submission-decided] ${decision._id} ${decision.status}: ${outcome}`)
})

/**
 * Answers `resumed`, or `no run waits` when the store answers 404: the run
 * has already carried out a decision, or has ended. Throws on any other
 * refusal, so it shows in `sanity functions logs`. The secret is never
 * logged.
 */
export async function postDecision(
  storeUrl: string | undefined,
  secret: string | undefined,
  decision: SubmissionDecision,
): Promise<'resumed' | 'no run waits'> {
  if (!storeUrl || !secret) {
    throw new Error('STORE_URL and TESTIMONIAL_DECISION_SECRET must be set on the function.')
  }
  const response = await fetch(new URL('/api/testimonials/decision', storeUrl), {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
    body: JSON.stringify(decision),
  })
  if (response.status === 404) return 'no run waits'
  if (!response.ok) throw new Error(`The store answered ${response.status} to the decision.`)
  return 'resumed'
}
