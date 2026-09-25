'use client'

import { useEffect, useMemo, useState } from 'react'
import { reportSearchGap } from '@/app/search/actions'
import { EmptyState } from '@/components/empty-state'
import { gridVariant } from '@/components/grid-variants'
import type { Category } from '@/lib/api/types'
import { RESULT_CAP, searchCatalogue, type SearchOutcome } from '@/lib/search'
import { cn } from '@/lib/utils'
import { EmptyState as SearchEmptyState } from './empty-state'
import { useSearchState, type SearchCatalogueValue } from './search-state'

/**
 * How long a query that found nothing must stay on screen before it counts
 * as a search gap. Typing past it, as with "umb" on the way to "umbrella",
 * leaves no record; the demand loop folds the prefixes that slip through.
 */
const GAP_PAUSE_MS = 300

/**
 * The results: the search the form applied, or the one the server rendered
 * until the form hydrates. It searches the catalogue in the shell with the
 * same `searchCatalogue` the server would use, so a change of query or
 * category shows at once, with no request.
 */
export function SearchResultsView({
  initialQuery,
  initialCategory,
}: {
  initialQuery: string
  initialCategory: string
}) {
  const { applied, catalogue } = useSearchState()
  const query = applied?.query ?? initialQuery
  const slug = applied?.category ?? initialCategory
  const { entries, featuredIds, featuredHeading, categories, cards } = catalogue
  // An unknown slug is treated as no filter at all.
  const category = categories.find((item) => item.slug === slug) ?? null
  const outcome = useMemo(
    () =>
      searchCatalogue({
        query,
        category,
        catalogue: entries,
        categories,
        featuredIds,
        featuredHeading,
      }),
    [query, category, entries, categories, featuredIds, featuredHeading],
  )

  // A query with no category and no results is a demand signal. The server
  // records the one it rendered; this records the ones typed since.
  const gap = outcome.ids.length === 0 && query && !category && query !== initialQuery ? query : null
  useEffect(() => {
    if (!gap) return
    const timer = setTimeout(() => void reportSearchGap(gap), GAP_PAUSE_MS)
    return () => clearTimeout(timer)
  }, [gap])

  const searching = Boolean(query || category)
  // The last search shown, kept while its panel collapses after a clear.
  const [kept, setKept] = useState<SearchShown | null>(null)
  if (searching && kept?.outcome !== outcome) setKept({ outcome, query, category })
  const panel = searching ? { outcome, query, category } : kept

  const featured = featuredIds.slice(0, RESULT_CAP)
  return (
    <>
      {/* Results open above the featured products and push them down, and
          collapse back up when the search is cleared. */}
      <section
        aria-label="Search results"
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
          searching ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
        inert={!searching}
      >
        <div className="flex min-h-0 flex-col gap-6 overflow-hidden">
          {panel ? <SearchPanel {...panel} categories={categories} cards={cards} /> : null}
        </div>
      </section>
      {featured.length > 0 ? (
        // A suggestion, set apart as the favourites row is, so it never reads
        // as the results of a search.
        <section
          aria-labelledby="search-featured-heading"
          className={cn(
            'flex flex-col gap-6 border-t border-border pt-8 md:pt-12',
            searching ? 'mt-6 md:mt-8' : 'mt-2 md:mt-4',
          )}
        >
          <h2 id="search-featured-heading" className="text-2xl font-medium tracking-tight">
            {featuredHeading}
          </h2>
          <Grid ids={featured} cards={cards} />
        </section>
      ) : searching ? null : (
        <EmptyState title="No products yet" />
      )}
    </>
  )
}

interface SearchShown {
  outcome: SearchOutcome
  query: string
  category: Category | null
}

/** One search's results, or what to do when it found nothing. */
function SearchPanel({
  outcome,
  query,
  category,
  categories,
  cards,
}: SearchShown & Pick<SearchCatalogueValue, 'categories' | 'cards'>) {
  if (outcome.ids.length === 0) {
    return <SearchEmptyState query={query} category={category} categories={categories} />
  }
  return (
    <>
      <div className="flex flex-col gap-1">
        <h2 aria-live="polite" className="text-xl font-medium tracking-tight">
          {outcome.heading}
        </h2>
        {outcome.hint ? <p className="text-sm text-fg-secondary">{outcome.hint}</p> : null}
        {outcome.capped ? (
          <p className="text-sm text-fg-secondary">Pick a category to narrow it down</p>
        ) : null}
      </div>
      <Grid ids={outcome.ids} cards={cards} />
    </>
  )
}

function Grid({
  ids,
  cards,
}: {
  ids: readonly string[]
  cards: SearchCatalogueValue['cards']
}) {
  return (
    <ul className={gridVariant('search').grid}>
      {ids.map((id) => (
        <li key={id}>{cards[id]}</li>
      ))}
    </ul>
  )
}
