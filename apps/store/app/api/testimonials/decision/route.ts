import { REVIEW_HOOK_PREFIX } from '@repo/testimonials/constants'
import { DecisionSchema, reviewDecisionOf, type ReviewDecision } from '@repo/testimonials/schemas'
import { resumeHook } from 'workflow/api'
import { HookNotFoundError } from 'workflow/errors'
import { authorised } from '@/lib/bearer'
import { serverEnv } from '@/lib/env'

/**
 * An editor's decision on a testimonial submission, posted by the
 * `submission-decided` Sanity Function: resumes the run waiting on
 * `testimonial-review:<runId>` (specs/E25-testimonial-agent.md). 404 when no
 * run waits: it has carried out a decision already, or has ended. With the
 * secret unset the route refuses every call.
 */
export async function POST(request: Request): Promise<Response> {
  if (!authorised(request.headers.get('authorization'), serverEnv.TESTIMONIAL_DECISION_SECRET)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = DecisionSchema.safeParse(await request.json().catch(() => null))
  if (!body.success) return Response.json({ error: 'Invalid body' }, { status: 400 })

  const { runId } = body.data
  try {
    await resumeHook<ReviewDecision>(`${REVIEW_HOOK_PREFIX}${runId}`, reviewDecisionOf(body.data))
  } catch (error) {
    if (!HookNotFoundError.is(error)) throw error
    return Response.json({ error: 'No run waits for this decision' }, { status: 404 })
  }
  return Response.json({ runId }, { status: 202 })
}
