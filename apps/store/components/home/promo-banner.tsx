import { unstable_rethrow } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { getPromotion } from '@/lib/api/promotions'

/**
 * The banner and its skeleton share this box so the shell reserves the same
 * space before and after the promotion streams in. Sized for the longest of
 * the four current promos: three lines at 375, two at md, one at lg.
 */
const BOX = 'min-h-[4.5rem] md:min-h-12 lg:min-h-8'

/**
 * The only dynamic hole on the home page: `getPromotion` is never cached and
 * this renders inside `<Suspense>`. Every field is shown as the API returns it
 * (specs/improvements.md). A failed call renders nothing and is logged, so a
 * promo outage never breaks the page.
 */
export async function PromoBanner() {
  let promotion
  try {
    promotion = await getPromotion()
  } catch (error) {
    unstable_rethrow(error)
    console.error(
      'PromoBanner: promotion unavailable, rendering without it',
      error,
    )
    return <div className={BOX} />
  }
  if (!promotion) return <div className={BOX} />
  return (
    <aside
      aria-label="Current promotion"
      className={`${BOX} text-sm leading-6`}
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
      className={`${BOX} flex flex-col justify-center gap-2 py-1`}
      aria-hidden="true"
    >
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5 md:hidden" />
      <Skeleton className="h-4 w-3/5 md:hidden" />
    </div>
  )
}
