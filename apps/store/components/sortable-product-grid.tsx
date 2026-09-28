import { SortableGrid } from '@/components/listing/sortable-grid'
import type { Product } from '@/lib/api/types'
import { VARIANTS, type GridVariant } from './grid-variants'
import { gridCards } from './product-grid'

/**
 * A product grid with a price sort above it. The cards are rendered here,
 * on the server, and handed to a client leaf that only re-orders them, so the
 * sort costs no request and the page stays prerendered. `summary` sits on the
 * sort's row, which keeps that row's height reserved before hydration.
 */
export async function SortableProductGrid({
  products,
  variant,
  summary,
  preloadCount,
}: {
  products: readonly Product[]
  variant: GridVariant
  summary: string
  preloadCount?: number
}) {
  const cards = await gridCards(products, variant, { preloadCount })
  return (
    <SortableGrid
      gridClassName={VARIANTS[variant].grid}
      summary={summary}
      items={cards.map(({ product, card }) => ({ id: product.id, price: product.price, card }))}
    />
  )
}
