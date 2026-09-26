import Link from 'next/link'
import { CardStock } from '@/components/card-stock'
import { PendingScope } from '@/components/pending-scope'
import { Price } from '@/components/price'
import { ProductImage } from '@/components/product-image'
import type { Product } from '@/lib/api/types'
import { cn } from '@/lib/utils'

/**
 * One product in a grid. `responsive` is a row below md and a grid card from
 * md, with the price as a pill on the photo; `card` is the grid card at every
 * width. The whole card is the link. The price renders in both places and each
 * is `display: none` in the other shape, so assistive technology reads it
 * once. `sizes` comes from the grid (`components/product-grid.tsx`). The class
 * strings are written out in full for each shape because Tailwind only sees
 * literal class names.
 *
 * `CardStock` sits over the photo opposite the price and is the only part of
 * the card that is not known at build; it reads the visit on the client, so
 * every grid stays prerendered.
 */
export type CardShape = 'responsive' | 'card'

const SHAPES = {
  responsive: {
    link: 'group grid grid-cols-[42%_minmax(0,1fr)] items-start gap-3.5 rounded-lg md:block',
    frame: 'md:group-hover:border-border-strong',
    image: 'md:group-hover:scale-[1.035]',
    pill: 'hidden md:inline-flex md:group-hover:border-accent md:group-hover:bg-accent md:group-hover:text-accent-fg',
    text: 'pt-1 md:pt-3',
    name: 'text-[15px] md:text-sm',
    inlinePrice: true,
  },
  card: {
    link: 'group block rounded-lg',
    frame: 'group-hover:border-border-strong',
    image: 'group-hover:scale-[1.035]',
    pill: 'inline-flex group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg',
    text: 'pt-3',
    name: 'text-sm',
    inlinePrice: false,
  },
} as const

interface CardProps {
  product: Product
  categoryName: string
  sizes: string
  preload?: boolean
  shape?: CardShape
}

export function ProductCard(props: CardProps) {
  return (
    <Link href={`/products/${props.product.slug}`} className={SHAPES[props.shape ?? 'responsive'].link}>
      <ProductCardBody {...props} />
    </Link>
  )
}

/** What a linked card shows: the photo with its price pill, then the name. */
function ProductCardBody({
  product,
  categoryName,
  sizes,
  preload = false,
  shape = 'responsive',
}: CardProps) {
  const c = SHAPES[shape]
  return (
    <>
      <div
        className={cn(
          'relative aspect-square overflow-hidden rounded-lg border border-border bg-bg-secondary motion-safe:transition-colors motion-safe:duration-250',
          c.frame,
        )}
      >
        <ProductImage
          product={product}
          alt=""
          preload={preload}
          sizes={sizes}
          className={cn(
            'motion-safe:transition-transform motion-safe:duration-400 motion-safe:ease-[cubic-bezier(.2,.7,.2,1)]',
            c.image,
          )}
        />
        <PendingScope
          className={cn(
            'absolute top-2.5 right-2.5 rounded-full border border-border bg-bg px-2 py-0.5 motion-safe:transition-colors motion-safe:duration-250',
            c.pill,
          )}
          pendingClassName="border-accent bg-accent text-accent-fg"
        >
          <Price cents={product.price} currency={product.currency} size="sm" className="text-xs" />
        </PendingScope>
        <CardStock productId={product.id} />
      </div>
      <div className={cn('flex min-w-0 flex-col gap-1', c.text)}>
        {c.inlinePrice ? (
          <Price
            cents={product.price}
            currency={product.currency}
            size="sm"
            className="md:hidden"
          />
        ) : null}
        {/* The size first: tailwind-merge drops a `leading-*` that precedes a `text-*` size. */}
        <span className={cn(c.name, 'leading-snug font-medium text-pretty')}>
          {product.name}
        </span>
        <span className="text-sm text-fg-secondary">{categoryName}</span>
      </div>
    </>
  )
}

/** The classes on the button that wraps an add card. */
export const ADD_CARD_CLASS_NAME = 'group block h-full rounded-lg'

/**
 * What an add card shows, for a card that is an add button rather than a
 * link: one white tile with the photo, the name and the price, and on a touch
 * screen an "Add to cart" strip, because there is no hover to show that the
 * card adds; with a pointer a plus on the photo says it. The tile is the
 * photos' white in both themes. Spans throughout, because a button holds only
 * phrasing content.
 */
export function AddCardBody({
  product,
  sizes,
}: {
  product: Product
  sizes: string
}) {
  return (
    <span className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-photo text-on-photo motion-safe:transition-colors motion-safe:duration-250 group-hover:border-border-strong">
      <span className="relative block aspect-square overflow-hidden">
        <ProductImage
          product={product}
          alt=""
          sizes={sizes}
          className="motion-safe:transition-transform motion-safe:duration-400 motion-safe:ease-[cubic-bezier(.2,.7,.2,1)] group-hover:scale-[1.035]"
        />
        <CardStock productId={product.id} />
        <span
          aria-hidden="true"
          className="absolute right-2.5 bottom-2.5 flex size-8 items-center justify-center rounded-full border border-border bg-photo text-lg leading-none pointer-coarse:hidden motion-safe:transition-colors motion-safe:duration-250 group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg group-focus-visible:border-accent group-focus-visible:bg-accent group-focus-visible:text-accent-fg"
        >
          +
        </span>
      </span>
      <span className="flex flex-1 flex-col gap-1 px-3 pt-2 pb-3 text-left">
        {/* The size first: tailwind-merge drops a `leading-*` that precedes a `text-*` size. */}
        <span className="line-clamp-2 text-sm leading-snug font-medium text-pretty">
          {product.name}
        </span>
        <Price cents={product.price} currency={product.currency} size="sm" className="mt-auto" />
      </span>
      <span aria-hidden="true" className="hidden px-2 pb-2 pointer-coarse:block">
        <span className="flex justify-center rounded-md bg-accent py-2 text-xs leading-4 font-medium text-accent-fg">
          Add to cart
        </span>
      </span>
    </span>
  )
}
