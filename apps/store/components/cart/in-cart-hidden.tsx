'use client'

import type { ReactNode } from 'react'
import { useVisit } from '@/components/visit/visit-provider'
import { useHydrated } from '@/lib/use-hydrated'

/**
 * A grid item that disappears once its product is in the cart, counting an
 * add in flight, so a product added from the favourites row leaves the row at
 * the click. While hydrating it renders, because the server already left out
 * what the cart held.
 */
export function InCartHidden({
  productId,
  children,
}: {
  productId: string
  children: ReactNode
}) {
  const { inCart } = useVisit()
  const hydrated = useHydrated()
  if (hydrated && inCart(productId) > 0) return null
  return <li>{children}</li>
}
