import { getSession, sessionStore } from '@/lib/session/store'
import { catalogueIds, completeVisit } from '@/lib/visit/draw'
import type { OpenedVisit } from '@/lib/visit/open'

/**
 * Throws the visitor's visit away and answers a fresh one from
 * `completeVisit`. It leaves the cart alone. 503 when the session store
 * cannot be reached, because a reset it cannot keep changes nothing on the
 * next render.
 */
export async function DELETE(): Promise<Response> {
  // The catalogue read never rejects, so it can start before the session's.
  const productIds = catalogueIds()
  const session = await getSession()
  if (session === 'unavailable' || !(await sessionStore.clearVisit(session.sid))) {
    return Response.json({ ok: false }, { status: 503 })
  }
  const visit: OpenedVisit = {
    stock: await completeVisit(session.sid, null, (await productIds) ?? []),
  }
  return Response.json(visit)
}
