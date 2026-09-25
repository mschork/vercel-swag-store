import { Skeleton } from '@/components/ui/skeleton'

/**
 * The stock line while it streams in; the rest of the buy panel is already
 * usable. Its own module because the page's Suspense fallback renders it, and
 * a client leaf cannot import from a module that reads the session.
 */
export function StockLineSkeleton() {
  return <Skeleton className="h-6 w-24" aria-hidden="true" />
}
