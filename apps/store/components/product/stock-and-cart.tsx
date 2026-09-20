import { JsonLd } from '@/components/json-ld'
import type { Product } from '@/lib/api/types'
import { publicEnv } from '@/lib/env.public'
import { stockStatus } from '@/lib/stock-status'
import { productJsonLd } from '@/lib/structured-data'
import { getVisit } from '@/lib/visit/cookie'
import { StockAndCartClient } from './stock-and-cart-client'

/**
 * The product page's only dynamic hole: it reads the visit cookie, so it
 * renders per request inside `<Suspense>`. The count comes from the visit
 * rather than a fresh stock call, which is what makes it the same number on
 * every reload (specs/E19-stable-visit.md).
 *
 * The Offer's availability follows the draw alone, never what the visitor's
 * own cart holds, so it describes the product and not the visitor. Without a
 * visit yet there is no count to state and the Offer omits it.
 */
export async function StockAndCart({ product }: { product: Product }) {
  const visit = await getVisit()
  const draw = visit ? (visit.stock[product.id] ?? null) : undefined
  return (
    <div className="flex flex-col gap-4">
      <StockAndCartClient productId={product.id} serverDraw={draw} />
      <JsonLd
        data={productJsonLd({
          product,
          availability: stockStatus(draw ?? null).availability,
          siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL,
        })}
      />
    </div>
  )
}
