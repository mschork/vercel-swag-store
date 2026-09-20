import Link from 'next/link'
import { Suspense } from 'react'
import { EmptyState } from '@/components/empty-state'
import { FavouriteProducts } from '@/components/favourite-products'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { FAVOURITES_FALLBACK } from '@/lib/content/fallbacks'
import { loadCart } from '@/lib/cart/get-cart'
import { toLines } from '@/lib/cart/lines'
import { getHomePage } from '@/lib/sanity/content'
import { getVisit } from '@/lib/visit/cookie'
import { CartView } from './cart-view'
import { QuickAddForm } from './quick-add-form'
import { EmptyCart } from './empty-cart'

/**
 * The cart page's dynamic hole. Three outcomes: no cart (never created,
 * expired, or no lines) is the empty state; a failed cart call says the cart
 * could not be loaded, because "your cart is empty" would be false; otherwise
 * the client view takes the lines.
 *
 * Under all of them, the same favourites row the home page shows. An empty
 * cart gets it unfiltered; a cart with lines gets it without the products
 * already in it. Only the exclusion is dynamic: the ranking and the catalogue
 * are cached. The row has its own boundary, so the lines never wait for it.
 *
 * The visitor's draws travel with the lines, so the first paint already caps
 * each stepper and says which line holds more than there is. They also decide
 * the favourites row: it offers only what the visitor could actually buy.
 */
export async function CartContents() {
  const [result, visit] = await Promise.all([loadCart('Cart'), getVisit()])
  if (!result) return <CartUnavailable />
  const { cart } = result
  const items = cart?.items ?? []
  const draws = Object.fromEntries(
    items.map((item) => [item.productId, visit?.stock[item.productId] ?? null]),
  )
  // A row that cross-sells something unbuyable wastes the only place on the
  // page where the visitor is ready to add one more thing.
  const soldOut = Object.entries(visit?.stock ?? {})
    .filter(([, count]) => count === 0)
    .map(([productId]) => productId)
  return (
    <>
      {cart && items.length > 0 ? (
        <CartView lines={toLines(cart)} currency={cart.currency} serverDraws={draws} />
      ) : (
        <EmptyCart />
      )}
      <Suspense fallback={<FavouritesSkeleton />}>
        <Favourites exclude={[...items.map((item) => item.productId), ...soldOut]} />
      </Suspense>
    </>
  )
}

/**
 * The favourites row with the heading the home page document owns, and an Add
 * to Cart under each card. This is the one place in the store that sells from
 * a grid, because it is the one grid that knows what the visitor can buy.
 */
async function Favourites({ exclude }: { exclude: readonly string[] }) {
  const content = await getHomePage()
  return (
    <FavouriteProducts
      heading={content?.favourites?.heading || FAVOURITES_FALLBACK.heading}
      exclude={exclude}
      slot={(product) => <QuickAddForm productId={product.id} name={product.name} />}
    />
  )
}

/** Mirrors the favourites row: the section's spacing, a heading and one row of cards with their button. */
function FavouritesSkeleton() {
  return (
    <div
      className="flex flex-col gap-6 border-t border-border py-12 md:py-16"
      aria-hidden="true"
    >
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((card) => (
          <div key={card}>
            <div className="grid grid-cols-[42%_minmax(0,1fr)] items-start gap-3.5 md:block">
              <Skeleton className="aspect-square rounded-lg" />
              <div className="flex flex-col gap-1 pt-1 md:pt-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
            <Skeleton className="mt-2 h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
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
