import type { ReviewDecision } from '@repo/testimonials/schemas'

/** The steps an editor's decision runs, bound to one run and its draft. */
export interface DecisionSteps {
  publish: (photoAlt: string) => Promise<unknown>
  sendOutcome: (decision: ReviewDecision) => Promise<void>
  dropPhotos: () => Promise<void>
  closeDecision: () => Promise<void>
}

/**
 * Carries out an editor's decision: publishes an accepted submission, emails
 * the visitor, deletes the photo and closes the submission. A failed publish
 * stops it with the photo and the submission kept for another try; a failed
 * email does not, because the address and the photo leave either way.
 */
export async function carryOut(decision: ReviewDecision, steps: DecisionSteps): Promise<{ emailed: boolean }> {
  if (decision.status === 'accepted') await steps.publish(decision.photoAlt)
  let emailed = true
  try {
    await steps.sendOutcome(decision)
  } catch {
    emailed = false
  }
  await steps.dropPhotos()
  await steps.closeDecision()
  return { emailed }
}
