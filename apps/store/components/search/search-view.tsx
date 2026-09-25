import { Suspense } from 'react'
import { Container } from '@/components/container'
import { SearchForm } from './search-form'
import { ResultsSkeleton, SearchResults } from './search-results'
import { SearchResultsRegion, SearchTransition } from './search-transition'

const DESCRIPTION = 'Search the store by name and narrow the results by category.'

type ParamValue = string | string[] | undefined

/**
 * The search page: heading, form and results. `searchParams` is passed on
 * unawaited: awaiting it here would make the whole route dynamic. The Suspense
 * boundary is not re-keyed per search, so the previous grid stays on screen
 * while the next one loads.
 *
 * Streamed metadata lands in the body, where a tool that reads only the head
 * finds no description. The description does not depend on the query, so it
 * is rendered here, and React moves it into the head of the prerendered shell.
 */
export function SearchView({
  searchParams,
}: {
  searchParams: Promise<Record<string, ParamValue>>
}) {
  return (
    <SearchTransition>
      <meta name="description" content={DESCRIPTION} />
      <meta property="og:description" content={DESCRIPTION} />
      <Container className="flex flex-col gap-6 py-8 md:gap-8 md:py-12">
        <h1 className="text-3xl font-medium tracking-tight">Search</h1>
        <SearchForm />
        <SearchResultsRegion>
          <Suspense fallback={<ResultsSkeleton />}>
            <SearchResults searchParams={searchParams} />
          </Suspense>
        </SearchResultsRegion>
      </Container>
    </SearchTransition>
  )
}
