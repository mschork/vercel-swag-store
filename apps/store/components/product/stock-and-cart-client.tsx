'use client'

import { useLayoutEffect } from 'react'
import { useProductStock, useVisit } from '@/components/visit/visit-provider'
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
 * `serverDraw` is what the server read in this render, so the first paint
 * carries the real count: from the cookie, or as an opening draw when
 * `opening` is set. `undefined` means the server has no count, and the
 * skeleton stays until the provider has opened a visit. Either way the
 * provider is told before paint, because it holds the open call for this.
 */
export function StockAndCartClient({
  productId,
  serverDraw,
  opening,
}: {
  productId: string
  serverDraw: number | null | undefined
  opening: boolean
}) {
  const { reportOpeningDraw } = useVisit()
  useLayoutEffect(() => {
    reportOpeningDraw(productId, opening ? (serverDraw ?? undefined) : undefined)
  }, [reportOpeningDraw, productId, opening, serverDraw])
  const { draw, inCart } = useProductStock(productId, serverDraw, opening)
  if (draw === undefined) return <StockSkeleton />

  const status = stockStatus(draw, inCart)
  return (
    <>
      <StockIndicator status={status} />
      <AddToCartForm
        productId={productId}
        max={status.maxQuantity}
        disabled={!status.canAddToCart}
        shown={opening && typeof draw === 'number' ? draw : undefined}
      />
    </>
  )
}
