import { ProductCard } from '@/components/product-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Product } from '@/lib/api/types'

/**
 * The two shapes a product grid takes. Each owns its column classes *and* the
 * `sizes` that follows from them, so a breakpoint can never change in one
 * place and leave `next/image` asking for the wrong width in the other.
 *
 * `home` stops at three columns: the home grid holds up to twelve products in
 * a `max-w-6xl` container, where a fourth column makes each card small enough
 * that the name pill wraps. `search` shows at most five, so one row of five at
 * lg fits the cap exactly.
 */
const VARIANTS = {
  home: {
    grid: 'grid grid-cols-2 gap-4 md:grid-cols-3',
    sizes: '(min-width: 768px) 33vw, 50vw',
  },
  search: {
    grid: 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5',
    sizes: '(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw',
  },
} as const

export type GridVariant = keyof typeof VARIANTS

/**
 * A list of product cards. `priorityCount` marks the first n images
 * `priority`; the home page leaves it at 0 because the hero is the LCP.
 */
export function ProductGrid({
  products,
  variant,
  priorityCount = 0,
}: {
  products: readonly Product[]
  variant: GridVariant
  priorityCount?: number
}) {
  const { grid, sizes } = VARIANTS[variant]
  return (
    <ul className={grid}>
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            sizes={sizes}
            priority={index < priorityCount}
          />
        </li>
      ))}
    </ul>
  )
}

/** The same grid, card-shaped: same columns, same gap, same aspect ratio, so the swap shifts nothing. */
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
        <Skeleton key={index} className="aspect-square rounded-lg" />
      ))}
    </div>
  )
}
