import { Skeleton } from '@/components/ui/skeleton'
import { getPromotion } from '@/lib/api/promotions'
import { loadOptional } from '@/lib/load-optional'

/**
 * The banner and its skeleton share this box so the shell reserves the same
 * space before and after the promotion streams in. Sized for the longest of
 * the four current promos at 24px lines plus 8px of padding: three lines at
 * 375 (80px), two at md (56px), one at lg (32px).
 */
const RESERVED_BOX = 'min-h-20 md:min-h-14 lg:min-h-8'

/**
 * The only dynamic hole on the home page: `getPromotion` is never cached and
 * this renders inside `<Suspense>`. Every field is shown as the API returns it
 * (specs/improvements.md). No promotion, or a failed call, leaves the reserved
 * box empty so nothing below it moves.
 */
export async function PromoBanner() {
  const promotion = await loadOptional('PromoBanner: promotion', getPromotion)
  if (!promotion) return <div className={RESERVED_BOX} />
  return (
    <aside
      aria-label="Current promotion"
      className={`${RESERVED_BOX} text-sm leading-6`}
    >
      <p className="rounded-lg bg-fg px-4 py-1 text-bg">
        <strong className="font-medium">{promotion.title}.</strong>{' '}
        {promotion.description} {promotion.discountPercent}% off with code{' '}
        <code className="font-mono">{promotion.code}</code>
      </p>
    </aside>
  )
}

export function PromoBannerSkeleton() {
  return (
    <div
      className={`${RESERVED_BOX} flex flex-col justify-center gap-2 py-1`}
      aria-hidden="true"
    >
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5 lg:hidden" />
      <Skeleton className="h-4 w-3/5 md:hidden" />
    </div>
  )
}
