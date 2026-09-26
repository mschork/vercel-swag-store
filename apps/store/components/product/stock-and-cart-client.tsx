'use client'

import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import { useProductStock } from '@/components/visit/visit-provider'
import type { LineDisplay } from '@/lib/cart/adds-in-flight'
import { CART_MAX_QUANTITY } from '@/lib/quantity'
import { stockStatus } from '@/lib/stock-status'
import { AddToCartForm } from './add-to-cart-form'
import { StockIndicator } from './stock-indicator'

/** Passes the server's draw from the stock line up to the panel's form. */
const ReportDraw = createContext<(draw: number | null) => void>(() => {})

/**
 * The buy panel: the stock line, then Add to Cart. It is part of the
 * prerendered page, so the form is there at once; `stockLine` is the one
 * part that streams, the visit's draw for this product. Both follow what is
 * left, the draw minus what this visitor's cart already holds, subtracted on
 * the client so the number follows an add without reading the cart again.
 *
 * Until a draw is known the form allows up to `CART_MAX_QUANTITY`; the add
 * action checks the draw, so an add made that early is still held to it.
 * `display` is what the cart page's row shows for the product while an add
 * of it is saving.
 */
export function StockAndCartClient({
  productId,
  display,
  stockLine,
}: {
  productId: string
  display: LineDisplay
  stockLine: ReactNode
}) {
  const [serverDraw, setServerDraw] = useState<number | null | undefined>(undefined)
  const { draw, inCart } = useProductStock(productId, serverDraw)
  const status = draw === undefined ? null : stockStatus(draw, inCart)
  return (
    <ReportDraw value={setServerDraw}>
      {stockLine}
      <AddToCartForm
        productId={productId}
        display={display}
        max={status ? status.maxQuantity : CART_MAX_QUANTITY}
        unavailable={status ? status.unavailableLabel : null}
      />
    </ReportDraw>
  )
}

/**
 * The stock line, rendered in the page's dynamic hole. `serverDraw` is the
 * visit's draw as the server read it in this render, so the line's first
 * paint carries the real count; it is also handed to the panel's form.
 */
export function StockLine({
  productId,
  serverDraw,
}: {
  productId: string
  serverDraw: number | null
}) {
  const report = use(ReportDraw)
  useEffect(() => report(serverDraw), [report, serverDraw])
  const { draw, inCart } = useProductStock(productId, serverDraw)
  return <StockIndicator status={stockStatus(draw ?? serverDraw, inCart)} />
}
