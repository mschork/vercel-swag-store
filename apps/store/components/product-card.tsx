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

/** The classes on the element that wraps a card: its link, or its add button. */
export const cardClassName = (shape: CardShape = 'responsive') => SHAPES[shape].link

interface CardProps {
  product: Product
  categoryName: string
  sizes: string
  preload?: boolean
  shape?: CardShape
}

export function ProductCard(props: CardProps) {
  return (
    <Link href={`/products/${props.product.slug}`} className={cardClassName(props.shape)}>
      <ProductCardBody {...props} />
    </Link>
  )
}

/**
 * What a card shows, for a wrapper other than its link. With `adds` the card
 * is an add button: a plus sits on the photo, and the price pill follows the
 * card's hover but not a navigation. Spans throughout, because a button holds
 * only phrasing content.
 */
export function ProductCardBody({
  product,
  categoryName,
  sizes,
  preload = false,
  shape = 'responsive',
  adds = false,
}: CardProps & { adds?: boolean }) {
  const c = SHAPES[shape]
  const pillClassName = cn(
    'absolute top-2.5 right-2.5 rounded-full border border-border bg-bg px-2 py-0.5 motion-safe:transition-colors motion-safe:duration-250',
    c.pill,
  )
  const price = (
    <Price cents={product.price} currency={product.currency} size="sm" className="text-xs" />
  )
  return (
    <>
      <span
        className={cn(
          'relative block aspect-square overflow-hidden rounded-lg border border-border bg-bg-secondary motion-safe:transition-colors motion-safe:duration-250',
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
        {adds ? (
          <span className={pillClassName}>{price}</span>
        ) : (
          <PendingScope className={pillClassName} pendingClassName="border-accent bg-accent text-accent-fg">
            {price}
          </PendingScope>
        )}
        <CardStock productId={product.id} />
        {adds ? (
          <span
            aria-hidden="true"
            className="absolute right-2.5 bottom-2.5 flex size-8 items-center justify-center rounded-full border border-border bg-bg text-lg leading-none motion-safe:transition-colors motion-safe:duration-250 group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg group-focus-visible:border-accent group-focus-visible:bg-accent group-focus-visible:text-accent-fg"
          >
            +
          </span>
        ) : null}
      </span>
      <span className={cn('flex min-w-0 flex-col gap-1 text-left', c.text)}>
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
      </span>
    </>
  )
}
