import { Container } from '@/components/container'
import { Skeleton } from '@/components/ui/skeleton'
import { getPromotion } from '@/lib/api/promotions'
import { loadOptional } from '@/lib/load-optional'

/**
 * The strip and its skeleton share this box so the shell reserves the same
 * space before and after the promotion streams in. Sized for the longest of
 * the four current promos at 13px on 20px lines plus 16px of padding: three
 * lines at 375 (76px), two at md (56px), one at lg (36px).
 */
const RESERVED_BOX = 'flex min-h-19 items-center md:min-h-14 lg:min-h-9'

/**
 * The accent strip under the header, on every route (E10). `getPromotion` is
 * never cached and this renders inside `<Suspense>` in the root layout, so it
 * is the one dynamic hole every page has. Every field is shown as the API
 * returns it (specs/improvements.md). No promotion, or a failed call, leaves
 * the reserved box empty so nothing below it moves.
 */
export async function PromoBanner() {
  const promotion = await loadOptional('PromoBanner: promotion', getPromotion)
  if (!promotion) return <div className={RESERVED_BOX} />
  return (
    <aside
      aria-label="Current promotion"
      className={`${RESERVED_BOX} bg-accent text-accent-fg`}
    >
      <Container>
        <p className="py-2 text-center text-[13px] leading-5">
          <strong className="font-medium">{promotion.title}.</strong>{' '}
          {promotion.description} {promotion.discountPercent}% off with code{' '}
          <code className="font-mono">{promotion.code}</code>
        </p>
      </Container>
    </aside>
  )
}

export function PromoBannerSkeleton() {
  return (
    <div className={RESERVED_BOX} aria-hidden="true">
      <Container className="flex flex-col items-center gap-2 py-2">
        <Skeleton className="h-4 w-full max-w-3xl" />
        <Skeleton className="h-4 w-4/5 max-w-2xl lg:hidden" />
        <Skeleton className="h-4 w-3/5 md:hidden" />
      </Container>
    </div>
  )
}
