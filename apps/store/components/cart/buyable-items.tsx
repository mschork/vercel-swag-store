'use client'

import type { ReactNode } from 'react'
import { useVisit } from '@/components/visit/visit-provider'
import { useHydrated } from '@/lib/use-hydrated'

/**
 * Grid items for products the visitor can buy: the first `limit` whose product
 * is not in the cart, counting an add in flight, and not drawn at zero. The
 * items are rendered on the server in rank order, so the row can sit in the
 * static shell. While hydrating it repeats the server's first `limit`, because
 * the server does not know the visitor; the row then settles once the visit
 * arrives, and a product added from it leaves at the click.
 */
export function BuyableItems({
  items,
  limit,
}: {
  items: readonly { productId: string; node: ReactNode }[]
  limit: number
}) {
  const { inCart, draw } = useVisit()
  const hydrated = useHydrated()
  const shown = hydrated
    ? items.filter(({ productId }) => inCart(productId) === 0 && draw(productId) !== 0)
    : items
  return shown.slice(0, limit).map(({ productId, node }) => <li key={productId}>{node}</li>)
}
