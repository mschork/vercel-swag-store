import { Skeleton } from '@/components/ui/skeleton'

/**
 * Mirrors `StockAndCartClient` box for box (stock line, quantity label and
 * controls beside the button, confirmation line), so the details column keeps
 * its height while the stock streams in. Its own module because both the
 * server hole and the client leaf render it, and the leaf cannot import from
 * a module that reads cookies.
 */
export function StockSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Skeleton className="h-6 w-24" />
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-11 w-36" />
          </div>
          <Skeleton className="h-11 md:flex-1" />
        </div>
        <div className="min-h-6" />
      </div>
    </div>
  )
}
