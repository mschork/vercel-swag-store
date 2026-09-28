'use client'

import { useProductStock } from '@/components/visit/visit-provider'
import { cardStock } from '@/lib/visit/remaining'

const TONE_CLASS = {
  danger: 'border-danger bg-danger text-bg',
  muted: 'border-border bg-bg text-fg-secondary',
  warning: 'border-warning bg-warning text-bg',
} as const

/**
 * What a card says about stock, over the photo opposite the price pill, so it
 * shifts nothing. A client leaf reading the visit the provider holds, which is
 * what lets every grid stay part of the static shell: no grid reads the
 * request, and none of them renders before the visit arrives.
 *
 * What it says is `cardStock`'s.
 *
 * It fades in, because it always arrives after the photo. A label that
 * changes keeps its element, so an add does not replay the fade.
 */
export function CardStock({ productId }: { productId: string }) {
  const { draw, inCart } = useProductStock(productId)
  const badge = draw === undefined ? null : cardStock(draw, inCart)
  if (!badge) return null

  return (
    <span
      className={`absolute top-2.5 left-2.5 animate-fade-in rounded-full border px-2 py-0.5 text-xs leading-5 font-medium motion-reduce:animate-none ${TONE_CLASS[badge.tone]}`}
    >
      {badge.label}
    </span>
  )
}
