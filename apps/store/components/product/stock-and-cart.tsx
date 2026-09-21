import type { Product } from '@/lib/api/types'
import { getVisit } from '@/lib/visit/cookie'
import { openingStock } from '@/lib/visit/opening'
import { OPENING_DRAW_MARKER } from '@/lib/visit/opening-limits'
import { StockAndCartClient } from './stock-and-cart-client'

/**
 * The product page's only dynamic hole, rendered per request inside
 * `<Suspense>`. With a visit the count comes from the cookie, which is what
 * makes it the same number on every reload (specs/E19-stable-visit.md).
 * Without one it awaits an opening draw from the stock endpoint, and the
 * browser hands that number to the visit (specs/E21-first-visit.md).
 */
export async function StockAndCart({ product }: { product: Product }) {
  const visit = await getVisit()
  const opening = visit ? undefined : await openingStock(product.id)
  const draw = visit ? (visit.stock[product.id] ?? null) : opening
  return (
    <div className="flex flex-col gap-4" {...(opening !== undefined ? { [OPENING_DRAW_MARKER]: '' } : {})}>
      <StockAndCartClient productId={product.id} serverDraw={draw} opening={opening !== undefined} />
    </div>
  )
}
