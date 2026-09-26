'use client'

import { createContext, use, useState, type ReactNode } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'
import type { Category } from '@/lib/api/types'
import type { Searchable } from '@/lib/search'
import { ResultsError } from './results-error'

/** A search as the form applied it: the query and the category slug, `''` for none. */
export interface AppliedSearch {
  query: string
  category: string
}

/**
 * Everything the browser needs to search: the catalogue's searchable fields,
 * the default state's products, the categories, and one server-rendered card
 * per product. It comes from the prerendered shell, so a search needs no
 * request.
 */
export interface SearchCatalogueValue {
  entries: readonly Searchable[]
  featuredIds: readonly string[]
  /** The heading over the default state, from `siteSettings.searchPage`. */
  featuredHeading: string
  categories: readonly Category[]
  cards: Readonly<Record<string, ReactNode>>
}

interface SearchState {
  /** `null` until the form has hydrated; the server's search stands until then. */
  applied: AppliedSearch | null
  apply: (search: AppliedSearch) => void
  catalogue: SearchCatalogueValue
}

const SearchStateContext = createContext<SearchState | null>(null)

export function useSearchState(): SearchState {
  const state = use(SearchStateContext)
  if (!state) throw new Error('useSearchState needs a SearchStateProvider')
  return state
}

/**
 * The form and the results grid are siblings, so the search the form applies
 * travels to the grid through a context rather than props.
 */
export function SearchStateProvider({
  catalogue,
  children,
}: {
  catalogue: SearchCatalogueValue
  children: ReactNode
}) {
  const [applied, apply] = useState<AppliedSearch | null>(null)
  return (
    <SearchStateContext value={{ applied, apply, catalogue }}>{children}</SearchStateContext>
  )
}

/**
 * Everything under the form: the results and the featured products. It is the
 * scope of the error boundary, so a failed results render leaves the form
 * usable and never reaches `app/error.tsx`.
 */
export function SearchResultsRegion({ children }: { children: ReactNode }) {
  // At least a screen tall, so the footer starts below the fold: results
  // shorter or taller than the skeleton then move nothing the visitor sees.
  return (
    <div className="flex min-h-svh flex-col gap-6">
      <ErrorBoundary fallback={(reset) => <ResultsError onReset={reset} />}>
        {children}
      </ErrorBoundary>
    </div>
  )
}
