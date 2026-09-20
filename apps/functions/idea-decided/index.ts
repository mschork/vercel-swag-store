import { createClient } from '@sanity/client'
import { documentEventHandler } from '@sanity/functions'
import { applyDecision, type IdeaStatus } from '@repo/demand'

/**
 * Finishes an editor's decision on a product idea. The Studio's Accept and
 * Reject actions set the status; the blueprint's filter fires this when the
 * status changes to `accepted` or `rejected`. It stamps the decision date and
 * promotes the idea's search gaps when it was accepted.
 *
 * Its own write changes `decidedAt`, not `status`, so it cannot trigger itself,
 * and `applyDecision` writes nothing for an idea that already has a date.
 */
interface IdeaEvent {
  _id: string
  status: IdeaStatus
}

export const handler = documentEventHandler<IdeaEvent>(async ({ context, event }) => {
  const { _id, status } = event.data
  if (status !== 'accepted' && status !== 'rejected') return
  if (context.local) {
    console.log(`[idea-decided] local run: would apply "${status}" to ${_id}`)
    return
  }
  const client = createClient({ ...context.clientOptions, apiVersion: '2026-09-01', useCdn: false })
  const result = await applyDecision(client, { ideaId: _id, decision: status })
  console.log(`[idea-decided] ${_id} ${status}: ${result}`)
})
