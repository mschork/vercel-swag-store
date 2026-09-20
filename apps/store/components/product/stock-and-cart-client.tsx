'use client'

import { useProductStock } from '@/components/visit/visit-provider'
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
 * `serverDraw` is what the cookie held in this render, so the first paint
 * carries the real count; `undefined` means there is no visit yet, and the
 * skeleton stays until the provider has opened one.
 */
export function StockAndCartClient({
  productId,
  serverDraw,
}: {
  productId: string
  serverDraw: number | null | undefined
}) {
  const { draw, inCart } = useProductStock(productId, serverDraw)
  if (draw === undefined) return <StockSkeleton />

  const status = stockStatus(draw, inCart)
  return (
    <>
      <StockIndicator status={status} />
      <AddToCartForm
        productId={productId}
        max={status.maxQuantity}
        disabled={!status.canAddToCart}
      />
    </>
  )
}
