import { Suspense } from 'react'
import type { Product } from '@/lib/api/types'
import { drawFor } from '@/lib/visit/draw'
import { StockAndCartClient, StockLine } from './stock-and-cart-client'
import { StockLineSkeleton } from './stock-skeleton'

/**
 * The product page's buy panel. Everything but the stock line is part of the
 * prerendered page; the stock line is its only dynamic hole.
 */
export function StockAndCart({ product }: { product: Product }) {
  const { slug, name, price } = product
  return (
    <div className="flex flex-col gap-4">
      <StockAndCartClient
        productId={product.id}
        display={{ slug, name, image: product.images[0] ?? null, price }}
        stockLine={
          <Suspense fallback={<StockLineSkeleton />}>
            <ServerStockLine productId={product.id} />
          </Suspense>
        }
      />
    </div>
  )
}

/**
 * Rendered per request. It shows the visit's draw for this product, drawn
 * and claimed here when the visit has none, so the panel never waits for the
 * seed. The session store keeps the first write, so the two show the same
 * number (docs/adr/0007-the-session-store.md).
 */
async function ServerStockLine({ productId }: { productId: string }) {
  const draw = await drawFor(productId)
  return <StockLine productId={productId} serverDraw={draw} />
}
