import { Container } from '@/components/container'
import { NEEDS_SCRIPT } from '@/components/no-script-notice'
import { Skeleton } from '@/components/ui/skeleton'
import { pinnedPromotion } from '@/lib/visit/draw'
import { PromoStrip, RESERVED_BOX } from './promo-strip'

/**
 * The accent strip under the header, on every route. It shows the promotion
 * the visit pinned, so the code a visitor reads here is the code still there
 * when they reach the cart; the API picks a different one of its four on every
 * request. On a first visit it reads one and claims it in the session store,
 * where the first write wins, so the seed pins the same one
 * (docs/adr/0007-the-session-store.md). It renders inside `<Suspense>` in the
 * root layout so the shell stays static. Without a promotion the reserved box
 * stays empty and nothing moves.
 */
export async function PromoBanner() {
  return <PromoStrip serverPromotion={await pinnedPromotion()} />
}

export function PromoBannerSkeleton() {
  return (
    <div className={RESERVED_BOX} aria-hidden="true" {...NEEDS_SCRIPT}>
      <Container className="flex flex-col items-center gap-2 py-2">
        <Skeleton className="h-4 w-full max-w-3xl bg-accent-fg/20" />
        <Skeleton className="hidden h-4 w-4/5 max-w-2xl bg-accent-fg/20 motion-reduce:block motion-reduce:lg:hidden" />
        <Skeleton className="hidden h-4 w-3/5 bg-accent-fg/20 motion-reduce:block motion-reduce:md:hidden" />
      </Container>
    </div>
  )
}
