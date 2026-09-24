import { getSession, type CartRecord } from '@/lib/session/store'
import { completeVisit } from '@/lib/visit/draw'
import { VisitSeedClient } from './visit-provider'

/**
 * Hands the visit and the cart's quantities to the provider, inside the
 * layout's Suspense boundary so the shell stays static. It completes the
 * visit first, drawing and claiming every product the visit has no draw for,
 * so what it hands over always covers the catalogue. When the session store
 * cannot be reached it hands over nothing.
 */
export async function VisitSeed() {
  const session = await getSession()
  if (session === 'unavailable') return <VisitSeedClient value={null} />

  const { stock, promotion } = await completeVisit(session.sid, session.visit)
  return <VisitSeedClient value={{ stock, promotion, lines: lineQuantities(session.cart) }} />
}

function lineQuantities(cart: CartRecord | null): Record<string, number> {
  return Object.fromEntries((cart?.lines ?? []).map((line) => [line.productId, line.quantity]))
}
