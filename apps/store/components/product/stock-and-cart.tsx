import { JsonLd } from '@/components/json-ld'
import { Skeleton } from '@/components/ui/skeleton'
import { getStock } from '@/lib/api/stock'
import type { Product } from '@/lib/api/types'
import { publicEnv } from '@/lib/env.public'
import { loadOptional } from '@/lib/load-optional'
import { stockStatus } from '@/lib/stock-status'
import { productJsonLd } from '@/lib/structured-data'
import { AddToCartForm } from './add-to-cart-form'
import { StockIndicator } from './stock-indicator'

/**
 * The product page's only dynamic hole. `getStock` is never cached, so this
 * renders per request inside `<Suspense>`: the stock line, the Add to Cart form
 * limited to live stock, and the Product JSON-LD, whose Offer availability has
 * to match the stock the page shows. A failed stock call renders "Stock
 * unavailable" with the form disabled instead of taking the page down.
 */
export async function StockAndCart({ product }: { product: Product }) {
  const stock = await loadOptional(`Stock for ${product.id}`, () =>
    getStock(product.id),
  )
  const status = stockStatus(stock)
  return (
    <div className="flex flex-col gap-4">
      <StockIndicator status={status} />
      <AddToCartForm
        productId={product.id}
        max={status.maxQuantity}
        disabled={!status.canAddToCart}
      />
      <JsonLd
        data={productJsonLd({
          product,
          availability: status.availability,
          siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL,
        })}
      />
    </div>
  )
}

/**
 * Mirrors `StockAndCart` box for box (stock line, quantity label and controls
 * beside the button, confirmation line), so the details column keeps its
 * height when the stock streams in.
 */
export function StockSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton className="h-6 w-24" />
      <div className="flex flex-col gap-3">
        <div className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-10 flex-1" />
        </div>
        <div className="min-h-6" />
      </div>
    </div>
  )
}
