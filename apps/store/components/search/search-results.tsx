import { Skeleton } from '@/components/ui/skeleton'
import { ProductGridSkeleton } from '@/components/product-grid'
import { getCategories } from '@/lib/api/categories'
import { getAllProducts, getFeaturedProducts } from '@/lib/api/products'
import { RESULT_CAP, normaliseQuery, searchCatalogue } from '@/lib/search'
import { recordGapAfterResponse } from '@/lib/search/record-gap'
import { SearchResultsView } from './search-results-view'

type ParamValue = string | string[] | undefined

/** A repeated param (`?q=a&q=b`) is a URL nobody wrote; the first one wins. */
const first = (value: ParamValue): string | undefined =>
  Array.isArray(value) ? value[0] : value

/**
 * The page's only dynamic part: the search the URL asks for, as the first
 * render shows it. It takes the `searchParams` promise rather than its value
 * so the page can hand it over without awaiting, which is what keeps the
 * shell prerendered. `SearchResultsView` renders the results and takes over
 * once the form hydrates. A failed read propagates to the results error
 * boundary, which keeps the form on screen.
 */
export async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, ParamValue>>
}) {
  const params = await searchParams
  const query = normaliseQuery(first(params.q))
  const slug = first(params.category) ?? ''
  if (query) await recordIfEmpty(query, slug)
  return <SearchResultsView initialQuery={query} initialCategory={slug} />
}

/**
 * A query with no category that finds nothing is a demand signal; the write
 * happens after the response. The reads are the shell's, so they cost no call.
 */
async function recordIfEmpty(query: string, slug: string): Promise<void> {
  const [catalogue, featured, categories] = await Promise.all([
    getAllProducts(),
    getFeaturedProducts({ limit: RESULT_CAP, min: RESULT_CAP }),
    getCategories(),
  ])
  const category = categories.find((item) => item.slug === slug) ?? null
  if (category) return
  const outcome = searchCatalogue({
    query,
    category,
    catalogue,
    categories,
    featuredIds: featured.map((product) => product.id),
  })
  if (outcome.ids.length === 0) await recordGapAfterResponse(query)
}

/** The grid and a heading in their final shape, so the swap into results shifts nothing. */
export function ResultsSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-1" aria-hidden="true">
        <Skeleton className="h-7 w-32" />
      </div>
      <ProductGridSkeleton variant="search" count={RESULT_CAP} />
    </>
  )
}
