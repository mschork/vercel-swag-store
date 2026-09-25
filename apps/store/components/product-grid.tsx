import type { ReactNode } from 'react'
import { BuyableItems } from '@/components/cart/buyable-items'
import { SortableGrid } from '@/components/listing/sortable-grid'
import { ProductCard } from '@/components/product-card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategories } from '@/lib/api/categories'
import type { Product } from '@/lib/api/types'

/**
 * The grid variants. Each owns its column classes and the `sizes` that follows
 * from them, so a breakpoint can never change in one place and leave
 * `next/image` asking for the wrong width in the other. `listing` is the one
 * variant that is card-shaped below md, and tells the card so through `shape`.
 */
const VARIANTS = {
  home: {
    grid: 'grid gap-4 md:grid-cols-3',
    sizes: '(min-width: 1152px) 358px, (min-width: 768px) 33vw, 42vw',
  },
  favourites: {
    grid: 'grid gap-4 md:grid-cols-4',
    sizes: '(min-width: 1152px) 264px, (min-width: 768px) 25vw, 42vw',
  },
  search: {
    grid: 'grid gap-4 md:grid-cols-3 lg:grid-cols-5',
    sizes:
      '(min-width: 1152px) 208px, (min-width: 1024px) 20vw, (min-width: 768px) 33vw, 42vw',
  },
  listing: {
    grid: 'grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-4 lg:grid-cols-4',
    sizes:
      '(min-width: 1152px) 264px, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw',
    shape: 'card',
  },
} as const

export type GridVariant = keyof typeof VARIANTS

/**
 * A list of product cards. `preloadCount` marks the first n images for
 * preloading; the home page leaves it at 0 because the hero is the LCP. The
 * category names come from the cached list, so a card can show "Bags" rather
 * than the slug.
 *
 * `slot` renders under a card, inside the list item but outside the link, so a
 * grid can carry a control without putting a button inside a link. With
 * `buyableLimit` the grid shows at most that many cards, and only for products
 * the visitor can buy (`BuyableItems`). Only the cart page's favourites row
 * uses either.
 */
export async function ProductGrid({
  products,
  variant,
  preloadCount = 0,
  slot,
  buyableLimit,
}: {
  products: readonly Product[]
  variant: GridVariant
  preloadCount?: number
  slot?: (product: Product) => ReactNode
  buyableLimit?: number
}) {
  const { grid, sizes } = VARIANTS[variant]
  const categories = await getCategories()
  const nameOf = (slug: string) =>
    categories.find((category) => category.slug === slug)?.name ?? slug
  const item = (product: Product, index: number) => (
    <>
      <ProductCard
        product={product}
        categoryName={nameOf(product.category)}
        sizes={sizes}
        preload={index < preloadCount}
      />
      {slot?.(product)}
    </>
  )
  return (
    <ul className={grid}>
      {buyableLimit === undefined ? (
        products.map((product, index) => <li key={product.id}>{item(product, index)}</li>)
      ) : (
        <BuyableItems
          items={products.map((product, index) => ({
            productId: product.id,
            node: item(product, index),
          }))}
          limit={buyableLimit}
        />
      )}
    </ul>
  )
}

/**
 * The same grid with a price sort above it. The cards are rendered here,
 * on the server, and handed to a client leaf that only re-orders them, so the
 * sort costs no request and the page stays prerendered. `summary` sits on the
 * sort's row, which keeps that row's height reserved before hydration.
 */
export async function SortableProductGrid({
  products,
  variant,
  summary,
  preloadCount = 0,
}: {
  products: readonly Product[]
  variant: GridVariant
  summary: string
  preloadCount?: number
}) {
  const config = VARIANTS[variant]
  const { grid, sizes } = config
  const shape = 'shape' in config ? config.shape : undefined
  const categories = await getCategories()
  const nameOf = (slug: string) =>
    categories.find((category) => category.slug === slug)?.name ?? slug
  return (
    <SortableGrid
      gridClassName={grid}
      summary={summary}
      items={products.map((product, index) => ({
        id: product.id,
        price: product.price,
        card: (
          <ProductCard
            product={product}
            categoryName={nameOf(product.category)}
            sizes={sizes}
            preload={index < preloadCount}
            shape={shape}
          />
        ),
      }))}
    />
  )
}

/** The same grid, card-shaped in both shapes, so the swap shifts nothing. */
export function ProductGridSkeleton({
  variant,
  count,
}: {
  variant: GridVariant
  count: number
}) {
  return (
    <div className={VARIANTS[variant].grid} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-[42%_minmax(0,1fr)] items-start gap-3.5 md:block"
        >
          <Skeleton className="aspect-square rounded-lg" />
          <div className="flex flex-col gap-2 pt-1 md:pt-3">
            <Skeleton className="h-4 w-12 md:hidden" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
