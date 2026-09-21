import { headers } from 'next/headers'
import { getAllProducts } from '@/lib/api/products'
import type { Cart } from '@/lib/api/types'
import { loadCart } from '@/lib/cart/get-cart'
import { loadOptional } from '@/lib/load-optional'
import { getVisit } from '@/lib/visit/cookie'
import { openingPromotion } from '@/lib/visit/opening'
import { VisitSeedClient, type SeededVisit } from './visit-provider'

/**
 * Hands the visit cookie and the cart to the provider, inside the layout's
 * Suspense boundary so the shell stays static. Reading the cookie costs
 * nothing; the cart is the slow part, and it comes from the request-memoized
 * `loadCart`, which the header badge has usually already paid for. Without a
 * visit it hands over the promotion the banner shows, for the open call to
 * hand back.
 *
 * Inside an action's response the cart read is skipped, as the badge skips
 * it: the action answers with the line it wrote, and the client applies that.
 * A failed read is left out for the same reason, so neither ever replaces the
 * quantities the client holds with an empty set.
 *
 * It also says whether the visit covers the catalogue, so a visitor whose
 * visit predates a new product tops up instead of reading "Stock unavailable"
 * until it expires. The catalogue read is cached, so it costs no call.
 */
export async function VisitSeed() {
  const visit = await getVisit()
  if (!visit) {
    return <VisitSeedClient value={null} openingPromotion={(await openingPromotion()) ?? undefined} />
  }

  const duringAction = (await headers()).has('next-action')
  const [result, products] = await Promise.all([
    duringAction ? undefined : loadCart('Visit seed: cart'),
    loadOptional('Visit seed: catalogue', getAllProducts),
  ])
  const value: SeededVisit = {
    stock: visit.stock,
    promotion: visit.promotion,
    complete:
      visit.promotion !== null &&
      (products ?? []).every((product) => product.id in visit.stock),
    ...(result ? { lines: lineQuantities(result.cart) } : {}),
  }
  return <VisitSeedClient value={value} />
}

function lineQuantities(cart: Cart | null): Record<string, number> {
  return Object.fromEntries(
    (cart?.items ?? []).map((item) => [item.productId, item.quantity]),
  )
}
