import { ProductCard } from '@/components/product-card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategories } from '@/lib/api/categories'
import type { Product } from '@/lib/api/types'

/**
 * The two shapes a product grid takes. Each owns its column classes *and* the
 * `sizes` that follows from them, so a breakpoint can never change in one
 * place and leave `next/image` asking for the wrong width in the other.
 *
 * Below md both are a single column of row cards whose photo is 42% wide.
 * `home` stops at three columns: the home grid holds up to twelve products.
 * `search` shows at most five, so one row of five at lg fits the cap exactly.
 * From 1152px the column stops growing (1104px of content), so the hints turn
 * into fixed widths: three columns of 357px, or five of 208px.
 */
const VARIANTS = {
  home: {
    grid: 'grid gap-4 md:grid-cols-3',
    sizes: '(min-width: 1152px) 358px, (min-width: 768px) 33vw, 42vw',
  },
  search: {
    grid: 'grid gap-4 md:grid-cols-3 lg:grid-cols-5',
    sizes:
      '(min-width: 1152px) 208px, (min-width: 1024px) 20vw, (min-width: 768px) 33vw, 42vw',
  },
} as const

export type GridVariant = keyof typeof VARIANTS

/**
 * A list of product cards. `preloadCount` marks the first n images for
 * preloading; the home page leaves it at 0 because the hero is the LCP. The
 * category names come from the cached list, so a card can show "Bags" rather
 * than the slug.
 */
export async function ProductGrid({
  products,
  variant,
  preloadCount = 0,
}: {
  products: readonly Product[]
  variant: GridVariant
  preloadCount?: number
}) {
  const { grid, sizes } = VARIANTS[variant]
  const categories = await getCategories()
  const nameOf = (slug: string) =>
    categories.find((category) => category.slug === slug)?.name ?? slug
  return (
    <ul className={grid}>
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            categoryName={nameOf(product.category)}
            sizes={sizes}
            preload={index < preloadCount}
          />
        </li>
      ))}
    </ul>
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
