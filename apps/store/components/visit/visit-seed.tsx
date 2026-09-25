import { Suspense } from 'react'
import { getSession, type CartRecord } from '@/lib/session/store'
import { catalogueIds, completeVisit } from '@/lib/visit/draw'
import { VisitSeedClient } from './visit-provider'

/**
 * The visit seed and its Suspense boundary. The catalogue is read here,
 * outside the boundary, so the read belongs to every route's prerender and a
 * request never pays for it. When the read fails, the seed reads it again at
 * request time.
 */
export async function VisitSeedBoundary() {
  const productIds = await catalogueIds()
  return (
    <Suspense fallback={null}>
      <VisitSeed productIds={productIds ?? undefined} />
    </Suspense>
  )
}

/**
 * Hands the visit and the cart's quantities to the provider; renders nothing
 * visible. It completes the visit first, drawing and claiming every product
 * the visit has no draw for, so what it hands over always covers the
 * catalogue. When the session store cannot be reached it hands over nothing.
 */
async function VisitSeed({ productIds }: { productIds?: readonly string[] }) {
  const session = await getSession()
  if (session === 'unavailable') return <VisitSeedClient value={null} />

  const { stock, promotion } = await completeVisit(session.sid, session.visit, productIds)
  return <VisitSeedClient value={{ stock, promotion, lines: lineQuantities(session.cart) }} />
}

function lineQuantities(cart: CartRecord | null): Record<string, number> {
  return Object.fromEntries((cart?.lines ?? []).map((line) => [line.productId, line.quantity]))
}
