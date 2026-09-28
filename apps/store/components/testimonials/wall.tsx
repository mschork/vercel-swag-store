import Link from 'next/link'
import type { Product } from '@/lib/api/types'
import { wallAnchor } from '@/lib/testimonials/wall'
import { WALL_PAGE_SIZE } from '@repo/testimonials/constants'
import type { TestimonialWallQueryResult } from '@repo/sanity/generated'
import { Attribution, EntryPhoto, Quote } from './entry'

/** The first row at the widest grid; the photos are the page's largest paint. */
const PRELOAD_COUNT = 4

/**
 * Every published testimonial with consent, newest first, as cards: the
 * photo, the words, who said them and the products they name. A product's
 * name and link come from the API, so one it no longer lists is left out.
 */
export function TestimonialWall({
  entries,
  products,
}: {
  entries: TestimonialWallQueryResult
  products: readonly Product[]
}) {
  const byId = new Map(products.map((product) => [product.id, product]))
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {entries.map((entry, index) => {
        const named = entry.productIds.flatMap((id) => byId.get(id) ?? [])
        // The first entry of each further page is where "Show more" lands.
        const starts = index > 0 && index % WALL_PAGE_SIZE === 0
        return (
          <li
            key={entry._id}
            id={starts ? wallAnchor(index / WALL_PAGE_SIZE + 1) : undefined}
            className="flex scroll-mt-24 flex-col gap-3"
          >
            <EntryPhoto
              entry={entry}
              sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, (min-width: 640px) 45vw, 90vw"
              preload={index < PRELOAD_COUNT}
            />
            <div className="flex flex-col gap-1">
              <Quote className="text-sm">{entry.quote}</Quote>
              <Attribution entry={entry} />
              {named.length > 0 ? (
                <ul className="flex flex-wrap gap-x-3 text-sm" aria-label="Products in the photo">
                  {named.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/products/${product.slug}`}
                        className="inline-block leading-6 underline underline-offset-4 hover:decoration-2"
                      >
                        {product.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
