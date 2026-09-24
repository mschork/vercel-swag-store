'use client'

import { useProductStock } from '@/components/visit/visit-provider'
import type { LineDisplay } from '@/lib/cart/adds-in-flight'
import { stockStatus } from '@/lib/stock-status'
import { AddToCartForm } from './add-to-cart-form'
import { StockIndicator } from './stock-indicator'
import { StockSkeleton } from './stock-skeleton'

/**
 * The stock line and the Add to Cart form, both driven by what is left: the
 * visit's draw minus what this visitor's cart already holds. Subtracting on
 * the client is what lets the number follow an add without reading the cart
 * again.
 *
 * `serverDraw` is the visit's draw as the server read it in this render, so
 * the first paint carries the real count. `display` is what the cart page's
 * row shows for the product while an add of it is saving.
 */
export function StockAndCartClient({
  productId,
  display,
  serverDraw,
}: {
  productId: string
  display: LineDisplay
  serverDraw: number | null
}) {
  const { draw, inCart } = useProductStock(productId, serverDraw)
  if (draw === undefined) return <StockSkeleton />

  const status = stockStatus(draw, inCart)
  return (
    <>
      <StockIndicator status={status} />
      <AddToCartForm
        productId={productId}
        display={display}
        max={status.maxQuantity}
        disabled={!status.canAddToCart}
      />
    </>
  )
}
