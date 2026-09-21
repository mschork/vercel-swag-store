import type { Product } from '@/lib/api/types'
import { getVisit } from '@/lib/visit/cookie'
import { StockAndCartClient } from './stock-and-cart-client'

/**
 * The product page's only dynamic hole: it reads the visit cookie, so it
 * renders per request inside `<Suspense>`. The count comes from the visit
 * rather than a fresh stock call, which is what makes it the same number on
 * every reload (specs/E19-stable-visit.md).
 */
export async function StockAndCart({ product }: { product: Product }) {
  const visit = await getVisit()
  const draw = visit ? (visit.stock[product.id] ?? null) : undefined
  return (
    <div className="flex flex-col gap-4">
      <StockAndCartClient productId={product.id} serverDraw={draw} />
    </div>
  )
}
