import Link from 'next/link'
import { after } from 'next/server'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getStoreConfig } from '@/lib/api/store'
import { loadCart } from '@/lib/cart/get-cart'
import { reconcileCart } from '@/lib/cart/reconcile'
import { loadOptional } from '@/lib/load-optional'
import { getSession } from '@/lib/session/store'
import { CartView } from './cart-view'

/**
 * The cart page's dynamic hole, rendered from the cart mirror with no cart
 * API call. A session the store could not read says the cart could not be
 * loaded, because "your cart is empty" would be false; otherwise the client
 * view takes the lines, and shows the empty state itself when it holds none
 * and no add is in flight. With no cart, the currency is the store's, from
 * the cached store config; without either, the cart could not be loaded.
 *
 * The visitor's draws travel with the lines, so the first paint already caps
 * each stepper and says which line holds more than there is.
 */
export async function CartContents() {
  const [cart, session] = await Promise.all([loadCart(), getSession()])
  if (cart === 'unavailable' || session === 'unavailable') return <CartUnavailable />
  if (session.cart) {
    const { sid } = session
    const { savedAt } = session.cart
    after(() => reconcileCart(sid, savedAt))
  }
  const lines = cart?.lines ?? []
  const currency =
    cart?.currency ?? (await loadOptional('Cart: store config', getStoreConfig))?.currency
  if (!currency) return <CartUnavailable />
  const stock = session.visit?.stock ?? {}
  const draws = Object.fromEntries(
    lines.map((line) => [line.productId, stock[line.productId] ?? null]),
  )
  return <CartView lines={lines} currency={currency} serverDraws={draws} />
}

function CartUnavailable() {
  return (
    <EmptyState title="Your cart could not be loaded">
      <Button size="lg" variant="outline" nativeButton={false} render={<Link href="/cart" />}>
        Try again
      </Button>
    </EmptyState>
  )
}

/**
 * Mirrors `CartView`: rows beside the summary from md, stacked below. A row's
 * name takes two lines below lg and the row reserves them, so the rows match
 * the skeleton whatever the name.
 */
export function CartSkeleton() {
  return (
    <div
      className="grid gap-8 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start lg:grid-cols-[minmax(0,1fr)_20rem]"
      aria-hidden="true"
    >
      <div className="flex flex-col divide-y divide-border border-y border-border">
        {[0, 1].map((row) => (
          <div key={row} className="flex gap-4 py-4">
            <Skeleton className="size-24 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-12 w-40 lg:h-6" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <Skeleton className="hidden h-6 w-16 md:block" />
                  <Skeleton className="h-11 w-36" />
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="h-52 rounded-lg" />
    </div>
  )
}
