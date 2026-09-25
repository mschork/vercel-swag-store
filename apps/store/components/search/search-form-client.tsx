'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { Category } from '@/lib/api/types'
import { ALL_CATEGORIES, SearchFormFields } from './search-form-fields'
import { useSearchState } from './search-state'

/** One or two characters match too much to be worth showing while typing. */
const MIN_AUTO_LENGTH = 3
/** How long the button shows pressed after a submit: long enough to be seen. */
const PRESSED_MS = 150

/** `/search` with the params that are set; no empty `q`. */
function searchHref(query: string, category: string): string {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (category) params.set('category', category)
  const suffix = params.toString()
  return suffix ? `/search?${suffix}` : '/search'
}

/**
 * The live form. Typing, Enter, the button and the category select all apply
 * the search at once: the results view searches the catalogue in the browser,
 * and the URL is replaced with `history.replaceState`, which Next's
 * `useSearchParams` follows, so a search is still a link and a reload
 * reproduces it, with a single history entry. A link that changes the URL,
 * such as a category chip or "Clear search", is applied the same way.
 *
 * Reads `useSearchParams`, so it sits inside a Suspense boundary whose
 * fallback is the same markup rendered by the server (`search-form.tsx`).
 */
export function SearchFormClient({
  categories,
}: {
  categories: readonly Category[]
}) {
  const params = useSearchParams()
  const { apply } = useSearchState()
  const urlQuery = params.get('q') ?? ''
  const urlCategory = params.get('category') ?? ALL_CATEGORIES

  const [query, setQuery] = useState(urlQuery)
  // The query this form last applied. The URL holding anything else means
  // someone else changed it: a category chip, "Clear search", the product
  // page's breadcrumb, or the Back button.
  const applied = useRef(urlQuery)
  const [pressed, setPressed] = useState(false)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // A search answers at once, so without this Enter would change nothing on
  // the button, and nothing at all when the results were already showing.
  const press = () => {
    if (pressTimer.current !== null) clearTimeout(pressTimer.current)
    setPressed(true)
    pressTimer.current = setTimeout(() => setPressed(false), PRESSED_MS)
  }
  useEffect(() => () => {
    if (pressTimer.current !== null) clearTimeout(pressTimer.current)
  }, [])

  useEffect(() => {
    apply({ query: urlQuery, category: urlCategory })
    if (urlQuery === applied.current) return
    applied.current = urlQuery
    setQuery(urlQuery)
  }, [urlQuery, urlCategory, apply])

  const search = (nextQuery: string, nextCategory: string) => {
    const trimmed = nextQuery.trim()
    applied.current = trimmed
    apply({ query: trimmed, category: nextCategory })
    window.history.replaceState(null, '', searchHref(trimmed, nextCategory))
  }

  const onQueryChange = (value: string) => {
    setQuery(value)
    const trimmed = value.trim()
    // Emptying the field, including through the search input's own clear
    // button, clears the query and keeps the category.
    if (trimmed === '') {
      if (applied.current !== '') search('', urlCategory)
      return
    }
    // The previous results stay on screen until the query is worth showing or
    // is submitted.
    if (trimmed.length < MIN_AUTO_LENGTH || trimmed === applied.current) return
    search(trimmed, urlCategory)
  }

  return (
    <SearchFormFields
      categories={categories}
      query={query}
      category={urlCategory}
      pressed={pressed}
      onSubmit={(event) => {
        event.preventDefault()
        press()
        search(query, urlCategory)
      }}
      onQueryChange={onQueryChange}
      onCategoryChange={(value) => search(query, value)}
    />
  )
}
