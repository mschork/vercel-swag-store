import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SearchForm } from '@/components/search/search-form'
import {
  ResultsSkeleton,
  SearchResults,
} from '@/components/search/search-results'
import {
  SearchResultsRegion,
  SearchTransition,
} from '@/components/search/search-transition'
import { normaliseQuery } from '@/lib/search'

type Props = PageProps<'/search'>

/**
 * Awaits `searchParams`, so the metadata streams in rather than being part of
 * the prerender; the page itself stays a partial prerender. Results are never
 * indexed: they are a slice of the catalogue under an arbitrary URL, and the
 * product pages are the pages worth finding.
 */
export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q } = await searchParams
  const query = normaliseQuery(Array.isArray(q) ? q[0] : q)
  return query
    ? { title: `Results for "${query}"`, robots: { index: false } }
    : { title: 'Search' }
}

/**
 * The heading and the form are the static shell; everything that depends on
 * the URL's params streams into the results region. `searchParams` is passed
 * on unawaited on purpose: awaiting it here would make the whole route
 * dynamic.
 *
 * The Suspense boundary is not re-keyed per search, so the previous grid stays
 * on screen while the next one loads and the skeleton is only ever seen on the
 * first load of the route (`specs/callout.md`).
 */
export default function SearchPage({ searchParams }: Props) {
  return (
    <SearchTransition>
      <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-10">
        <h1 className="text-3xl font-medium tracking-tight md:text-4xl">
          Search
        </h1>
        <SearchForm />
        <SearchResultsRegion>
          <Suspense fallback={<ResultsSkeleton />}>
            <SearchResults searchParams={searchParams} />
          </Suspense>
        </SearchResultsRegion>
      </div>
    </SearchTransition>
  )
}
