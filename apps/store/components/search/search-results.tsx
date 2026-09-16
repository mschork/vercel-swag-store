import { ProductGrid, ProductGridSkeleton } from '@/components/product-grid'
import { Skeleton } from '@/components/ui/skeleton'
import { getCategories } from '@/lib/api/categories'
import { getFeaturedProducts, getProducts } from '@/lib/api/products'
import type { Category, Product } from '@/lib/api/types'
import { RESULT_CAP, expandQuery, mergeResults, normaliseQuery } from '@/lib/search'
import { EmptyState } from '@/components/empty-state'
import { EmptyState as SearchEmptyState } from './empty-state'

/**
 * How many products the default state shows. Five, to match the cap on
 * results: arriving at a fuller grid than any search can return reads as the
 * search taking products away. It is also all the API flags as featured can
 * fill without a top-up, so nothing under the "Featured" heading is an
 * ordinary catalogue product. A display choice, never the featured count read
 * off the API (AGENTS.md rule 6); `min` keeps the grid full if one is
 * unflagged.
 */
const DEFAULT_COUNT = RESULT_CAP
/** How many images are preloaded: the first two rows on a phone. */
const PRELOAD_COUNT = 2

type ParamValue = string | string[] | undefined

/** A repeated param (`?q=a&q=b`) is a URL nobody wrote; take the first and move on. */
const first = (value: ParamValue): string | undefined =>
  Array.isArray(value) ? value[0] : value

interface Outcome {
  products: Product[]
  heading: string
  /** "Includes everything in {Category}", when the grid really holds it. */
  hint: string | null
  /** The cap cut results, so narrowing by category is worth suggesting. */
  capped: boolean
}

const countLabel = (count: number) =>
  `${count} ${count === 1 ? 'result' : 'results'}`

/**
 * The page's only dynamic part. It takes the `searchParams` promise rather
 * than its value so the page can hand it over without awaiting, which is what
 * keeps the shell prerendered.
 *
 * Nothing here is wrapped in try/catch: a failed call belongs to the results
 * error boundary around this component, which keeps the form on screen.
 */
export async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, ParamValue>>
}) {
  const [params, categories] = await Promise.all([searchParams, getCategories()])
  const query = normaliseQuery(first(params.q))
  // An unknown slug is a 422 from the API, so it is validated against the
  // cached list and otherwise treated as no filter at all.
  const slug = first(params.category)
  const category = categories.find((item) => item.slug === slug) ?? null

  const outcome = await search(query, category, categories)

  if (outcome.products.length === 0) {
    return query || category ? (
      <SearchEmptyState query={query} category={category} categories={categories} />
    ) : (
      <EmptyState title="No products yet" />
    )
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <h2 aria-live="polite" className="text-xl font-medium tracking-tight">
          {outcome.heading}
        </h2>
        {outcome.hint ? (
          <p className="text-sm text-fg-secondary">{outcome.hint}</p>
        ) : null}
        {outcome.capped ? (
          <p className="text-sm text-fg-secondary">
            Pick a category to narrow it down
          </p>
        ) : null}
      </div>
      <ProductGrid
        products={outcome.products}
        variant="search"
        preloadCount={PRELOAD_COUNT}
      />
    </>
  )
}

/**
 * Four routes through the API, chosen by what the URL holds.
 *
 * The interesting one is a query with no explicit category. The API's `search`
 * matches product names, descriptions and tags, so "hats" finds nothing at all
 * while the Hats category holds three products. When the query names a
 * category, its products are fetched alongside the search hits and merged
 * behind them.
 */
async function search(
  query: string,
  category: Category | null,
  categories: readonly Category[],
): Promise<Outcome> {
  if (!query && !category) {
    const products = await getFeaturedProducts({
      limit: DEFAULT_COUNT,
      min: DEFAULT_COUNT,
    })
    return { products, heading: 'Featured', hint: null, capped: false }
  }

  if (!query && category) {
    return plain(await listProducts({ category: category.slug }))
  }

  if (category) {
    return plain(await listProducts({ search: query, category: category.slug }))
  }

  const matched = expandQuery(query, categories)
  if (!matched) return plain(await listProducts({ search: query }))

  const [hits, inCategory] = await Promise.all([
    listProducts({ search: query }),
    listProducts({ category: matched.slug }),
  ])
  const merged = mergeResults(hits.products, inCategory.products, matched.slug)
  return {
    products: merged.products,
    heading: merged.truncated
      ? `Showing the first ${merged.products.length}`
      : countLabel(merged.products.length),
    // Only promise "everything in X" when the grid holds all of it: the cap
    // may have cut some of the category away.
    hint:
      merged.added && !merged.truncated
        ? `Includes everything in ${matched.name}`
        : null,
    capped: merged.truncated,
  }
}

const listProducts = (params: { search?: string; category?: string }) =>
  getProducts({ ...params, limit: RESULT_CAP })

/** One API call, so the API's own `total` says how much was left behind. */
function plain({
  products,
  pagination,
}: Awaited<ReturnType<typeof listProducts>>): Outcome {
  const capped = pagination.total > products.length
  return {
    products,
    heading: capped
      ? `Showing ${products.length} of ${pagination.total} results`
      : countLabel(products.length),
    hint: null,
    capped,
  }
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
