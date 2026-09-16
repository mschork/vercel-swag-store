import Link from 'next/link'
import { ProductImage } from '@/components/product-image'
import type { Product } from '@/lib/api/types'
import { formatPrice } from '@/lib/format'

/**
 * One product in a grid; shared by the home page and search. The whole card is
 * the link. `priority` is for a first row that is in the first viewport
 * (search); the home page leaves it off because the hero image is the LCP.
 * `sizes` comes from the grid, which owns the column count it follows from
 * (`components/product-grid.tsx`).
 */
export function ProductCard({
  product,
  sizes,
  priority = false,
}: {
  product: Product
  sizes: string
  priority?: boolean
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative block overflow-hidden rounded-lg border border-border bg-bg-secondary"
    >
      <div className="relative aspect-square">
        <ProductImage
          product={product}
          alt=""
          priority={priority}
          sizes={sizes}
        />
      </div>
      <div className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border border-border bg-bg py-1 pr-1 pl-3 text-sm">
        <span className="line-clamp-2 font-medium">{product.name}</span>
        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-fg tabular-nums">
          {formatPrice(product.price, product.currency)}
        </span>
      </div>
    </Link>
  )
}
