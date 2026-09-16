import Link from 'next/link'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { loadCart } from '@/lib/cart/get-cart'
import { toLines } from '@/lib/cart/lines'
import { CartView } from './cart-view'
import { EmptyCart } from './empty-cart'

/**
 * The cart page's dynamic hole. Three outcomes, kept apart on purpose: no cart
 * (never created, expired, or no lines) is the empty state; a failed cart call
 * says the cart could not be loaded, because "your cart is empty" would be
 * false (specs/callout.md); otherwise the client view takes the lines.
 */
export async function CartContents() {
  const result = await loadCart('Cart')
  if (!result) return <CartUnavailable />
  const { cart } = result
  if (!cart || cart.items.length === 0) return <EmptyCart />
  return <CartView lines={toLines(cart)} currency={cart.currency} />
}

function CartUnavailable() {
  return (
    <EmptyState title="Your cart could not be loaded">
      <Button size="lg" variant="outline" render={<Link href="/cart" />}>
        Try again
      </Button>
    </EmptyState>
  )
}

/** Mirrors `CartView`: two rows beside the summary from 768px, stacked below. */
export function CartSkeleton() {
  return (
    <div
      className="grid gap-8 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start lg:grid-cols-[minmax(0,1fr)_20rem]"
      aria-hidden="true"
    >
      <div className="flex flex-col divide-y divide-border border-y border-border">
        {[0, 1].map((row) => (
          <div key={row} className="flex gap-4 py-4">
            <Skeleton className="size-20 shrink-0 rounded-lg sm:size-24" />
            <div className="flex flex-1 flex-col gap-3">
              <div className="flex justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-6 w-40" />
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
