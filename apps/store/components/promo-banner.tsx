import { Container } from '@/components/container'
import { PromoMarquee } from '@/components/promo-marquee'
import { Skeleton } from '@/components/ui/skeleton'
import { getPromotion } from '@/lib/api/promotions'
import { loadOptional } from '@/lib/load-optional'

/**
 * The strip and its skeleton share this box, so the shell reserves the same
 * space before and after the promotion streams in. A line that does not fit
 * scrolls, so one line is enough. Under reduced motion the text wraps
 * instead, and the box reserves the wrapped height per breakpoint.
 */
const RESERVED_BOX =
  'flex min-h-9 items-center bg-accent text-accent-fg motion-reduce:min-h-19 motion-reduce:md:min-h-14 motion-reduce:lg:min-h-9'

/**
 * The accent strip under the header, on every route. The code is a ticket chip
 * and a line that does not fit scrolls (`PromoMarquee`). `getPromotion` is
 * never cached and this renders inside `<Suspense>` in the root layout, so it
 * is the one dynamic hole every page has. Without a promotion, and after a
 * failed call, the reserved box stays empty so nothing below it moves.
 */
export async function PromoBanner() {
  const promotion = await loadOptional('PromoBanner: promotion', getPromotion)
  if (!promotion) return <div className={RESERVED_BOX} />
  return (
    <aside
      aria-label="Current promotion"
      className={RESERVED_BOX}
    >
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

export function PromoBannerSkeleton() {
  return (
    <div className={RESERVED_BOX} aria-hidden="true">
      <Container className="flex flex-col items-center gap-2 py-2">
        <Skeleton className="h-4 w-full max-w-3xl bg-accent-fg/20" />
        <Skeleton className="hidden h-4 w-4/5 max-w-2xl bg-accent-fg/20 motion-reduce:block motion-reduce:lg:hidden" />
        <Skeleton className="hidden h-4 w-3/5 bg-accent-fg/20 motion-reduce:block motion-reduce:md:hidden" />
      </Container>
    </div>
  )
}
