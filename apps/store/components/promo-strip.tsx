'use client'

import type { Promotion } from '@/lib/api/types'
import { useVisit } from '@/components/visit/visit-provider'
import { PromoMarquee } from './promo-marquee'

/**
 * The strip and its skeleton share this box, so the shell reserves the same
 * space before and after the promotion streams in. A line that does not fit
 * scrolls, so one line is enough. Under reduced motion the text wraps
 * instead, and the box reserves the wrapped height per breakpoint.
 */
export const RESERVED_BOX =
  'flex min-h-9 items-center bg-accent text-accent-fg motion-reduce:min-h-19 motion-reduce:md:min-h-14 motion-reduce:lg:min-h-9'

/**
 * The promotion's words. A client leaf so the strip fills in as soon as a
 * first-time visitor's visit opens, without waiting for a page load;
 * `serverPromotion` is what the cookie held in this render, and is used until
 * the provider has a visit of its own.
 */
export function PromoStrip({ serverPromotion }: { serverPromotion: Promotion | null }) {
  const { promotion: held } = useVisit()
  const promotion = held === undefined ? serverPromotion : held
  if (!promotion) return <div className={RESERVED_BOX} />
  return (
    <aside aria-label="Current promotion" className={RESERVED_BOX}>
      <PromoMarquee>
        <p className="py-2 text-sm leading-5">
          <strong className="font-medium">{promotion.title}.</strong>{' '}
          {promotion.description} {promotion.discountPercent}% off with code{' '}
          <code className="ml-0.5 border-x-4 border-y border-accent-fg/70 px-1.5 py-px font-mono text-sm">
            {promotion.code}
          </code>
        </p>
      </PromoMarquee>
    </aside>
  )
}
