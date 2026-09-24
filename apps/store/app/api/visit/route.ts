import { getSession, sessionStore } from '@/lib/session/store'
import { completeVisit } from '@/lib/visit/draw'
import type { OpenedVisit } from '@/lib/visit/open'

/**
 * Throws the visitor's visit away and answers a fresh one from
 * `completeVisit`. It leaves the cart alone. 503 when the session store
 * cannot be reached, because a reset it cannot keep changes nothing on the
 * next render.
 */
export async function DELETE(): Promise<Response> {
  const session = await getSession()
  if (session === 'unavailable' || !(await sessionStore.clearVisit(session.sid))) {
    return Response.json({ ok: false }, { status: 503 })
  }
  const visit: OpenedVisit = await completeVisit(session.sid, null)
  return Response.json(visit)
}
