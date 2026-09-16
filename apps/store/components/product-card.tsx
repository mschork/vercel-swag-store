import Link from 'next/link'
import { PendingScope } from '@/components/pending-scope'
import { Price } from '@/components/price'
import { ProductImage } from '@/components/product-image'
import type { Product } from '@/lib/api/types'

/**
 * One product in a grid; shared by the home page and search (E10). Two
 * shapes, one anatomy: below md a row (photo at 42% of the width, then price,
 * name and category beside it, no hover); from md a grid card with the price
 * as a pill on the photo and the name and category under it. The whole card
 * is the link. On hover, and while the card's navigation is pending, the pill
 * inverts to the accent and the frame's border strengthens; Tailwind's
 * `hover:` only applies on devices that can hover.
 *
 * The price renders in both places and each is `display: none` in the other
 * shape, so assistive technology reads it once. `sizes` comes from the grid,
 * which owns the column count it follows from (`components/product-grid.tsx`).
 */
export function ProductCard({
  product,
  categoryName,
  sizes,
  preload = false,
}: {
  product: Product
  categoryName: string
  sizes: string
  preload?: boolean
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group grid grid-cols-[42%_minmax(0,1fr)] items-start gap-3.5 rounded-lg md:block"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-bg-secondary motion-safe:transition-colors motion-safe:duration-250 md:group-hover:border-border-strong">
        <ProductImage
          product={product}
          alt=""
          preload={preload}
          sizes={sizes}
          className="motion-safe:transition-transform motion-safe:duration-400 motion-safe:ease-[cubic-bezier(.2,.7,.2,1)] md:group-hover:scale-[1.035]"
        />
        <PendingScope
          className="absolute top-2.5 right-2.5 hidden rounded-full border border-border bg-bg px-2 py-0.5 motion-safe:transition-colors motion-safe:duration-250 md:inline-flex md:group-hover:border-accent md:group-hover:bg-accent md:group-hover:text-accent-fg"
          pendingClassName="border-accent bg-accent text-accent-fg"
        >
          <Price cents={product.price} currency={product.currency} size="sm" className="text-xs" />
        </PendingScope>
      </div>
      <div className="flex min-w-0 flex-col gap-1 pt-1 md:pt-3">
        <Price
          cents={product.price}
          currency={product.currency}
          size="sm"
          className="md:hidden"
        />
        <span className="text-[15px] leading-snug font-medium text-pretty md:text-sm">
          {product.name}
        </span>
        <span className="text-sm text-fg-secondary">{categoryName}</span>
      </div>
    </Link>
  )
}
