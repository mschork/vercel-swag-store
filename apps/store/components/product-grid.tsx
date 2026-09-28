import type { ReactNode } from 'react'
import { ADD_CARD_CLASS_NAME, AddCardBody, ProductCard } from '@/components/product-card'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategoryNames } from '@/lib/api/categories'
import type { Product } from '@/lib/api/types'
import { VARIANTS, type GridVariant } from './grid-variants'

/** Makes a card an add button: handed the card's content and the wrapper's classes. */
export type AddCard = (product: Product, card: ReactNode, className: string) => ReactNode

/**
 * One rendered card per product, for a grid of `variant`. `preloadCount`
 * marks the first n images for preloading. With `addCard` each card is an add
 * button in place of its link.
 */
export async function gridCards(
  products: readonly Product[],
  variant: GridVariant,
  { preloadCount = 0, addCard }: { preloadCount?: number; addCard?: AddCard } = {},
): Promise<{ product: Product; card: ReactNode }[]> {
  const config = VARIANTS[variant]
  const shape = 'shape' in config ? config.shape : undefined
  const nameOf = await getCategoryNames()
  return products.map((product, index) => ({
    product,
    card: addCard ? (
      addCard(product, <AddCardBody product={product} sizes={config.sizes} />, ADD_CARD_CLASS_NAME)
    ) : (
      <ProductCard
        product={product}
        categoryName={nameOf(product.category)}
        sizes={config.sizes}
        preload={index < preloadCount}
        shape={shape}
      />
    ),
  }))
}

/**
 * A list of product cards. The home page leaves `preloadCount` at 0 because
 * the hero is the LCP. The sorted grid and the buyable grid live in their own
 * files, so a page with a plain grid ships neither client component.
 */
export async function ProductGrid({
  products,
  variant,
  preloadCount,
  addCard,
}: {
  products: readonly Product[]
  variant: GridVariant
  preloadCount?: number
  addCard?: AddCard
}) {
  const cards = await gridCards(products, variant, { preloadCount, addCard })
  return (
    <ul className={VARIANTS[variant].grid}>
      {cards.map(({ product, card }) => (
        <li key={product.id}>{card}</li>
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
