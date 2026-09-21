'use client'

import { useProductStock } from '@/components/visit/visit-provider'
import { LOW_STOCK_THRESHOLD } from '@/lib/stock-status'

/**
 * What a card says about stock, over the photo opposite the price pill, so it
 * shifts nothing. A client leaf reading the visit the provider holds, which is
 * what lets every grid stay part of the static shell: no grid reads the
 * request, and none of them renders before the visit arrives.
 *
 * Nothing is shown for a product a visitor can simply buy, so the badge means
 * "read this" rather than decorating every card.
 *
 * The wording is the card's own where the product page's would not fit: a
 * product whose whole draw is in the visitor's cart reads "In your cart" here
 * and "All N are in your cart" there.
 *
 * It fades in, because it always arrives after the photo. A label that
 * changes keeps its element, so an add does not replay the fade.
 */
export function CardStock({ productId }: { productId: string }) {
  const { draw, inCart } = useProductStock(productId)
  if (draw === undefined || draw === null) return null

  const remaining = Math.max(0, draw - inCart)
  if (draw > 0 && remaining > LOW_STOCK_THRESHOLD) return null

  const { label, tone } =
    draw === 0
      ? { label: 'Out of stock', tone: 'border-danger bg-danger text-bg' }
      : remaining === 0
        ? { label: 'In your cart', tone: 'border-border bg-bg text-fg-secondary' }
        : { label: `Only ${remaining} left`, tone: 'border-warning bg-warning text-bg' }

  return (
    <span
      className={`absolute top-2.5 left-2.5 animate-fade-in rounded-full border px-2 py-0.5 text-xs leading-5 font-medium motion-reduce:animate-none ${tone}`}
    >
      {label}
    </span>
  )
}
