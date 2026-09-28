import { BuyableItems } from '@/components/cart/buyable-items'
import type { Product } from '@/lib/api/types'
import { VARIANTS, type GridVariant } from './grid-variants'
import { gridCards, type AddCard } from './product-grid'

/**
 * A product grid that shows at most `limit` cards, and only for products the
 * visitor can buy (`BuyableItems`). Every card is rendered on the server, so
 * the grid can sit in a static shell.
 */
export async function BuyableProductGrid({
  products,
  variant,
  limit,
  addCard,
}: {
  products: readonly Product[]
  variant: GridVariant
  limit: number
  addCard?: AddCard
}) {
  const cards = await gridCards(products, variant, { addCard })
  return (
    <ul className={VARIANTS[variant].grid}>
      <BuyableItems
        items={cards.map(({ product, card }) => ({ productId: product.id, node: card }))}
        limit={limit}
      />
    </ul>
  )
}
