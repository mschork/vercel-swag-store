'use client'

import type { Route } from 'next'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useOptimistic, useRef, useState } from 'react'
import type { Category } from '@/lib/api/types'
import { ALL_CATEGORIES, SearchFormFields } from './search-form-fields'
import { useSearchTransition } from './search-transition'

/** Long enough that a typed word is worth a request, short enough to feel live. */
const MIN_AUTO_LENGTH = 3
/** One request per pause in typing, not one per keystroke. */
const DEBOUNCE_MS = 300

/** `/search` with the params that are set; no empty `q`, which the API rejects. */
function searchHref(query: string, category: string): Route {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (category) params.set('category', category)
  const suffix = params.toString()
  return suffix ? `/search?${suffix}` : '/search'
}

/**
 * The live form. Enter, the button, the debounce and the category select all
 * end in the same `router.replace` inside the page's one transition, so there
 * is a single pending state and a single history entry: a search refines the
 * current view rather than adding a step to go back through.
 *
 * Reads `useSearchParams`, so it sits inside a Suspense boundary whose
 * fallback is the same markup rendered by the server (`search-form.tsx`).
 */
export function SearchFormClient({
  categories,
}: {
  categories: readonly Category[]
}) {
  const router = useRouter()
  const params = useSearchParams()
  const { isPending, start } = useSearchTransition()
  const urlQuery = params.get('q') ?? ''
  const urlCategory = params.get('category') ?? ALL_CATEGORIES

  const [query, setQuery] = useState(urlQuery)
  // The select shows the chosen category at once; the URL is still the source
  // of truth and takes over when the navigation commits.
  const [category, setCategory] = useOptimistic(urlCategory)
  // The query this form last navigated to. The URL holding anything else means
  // someone else changed it: a category chip, "Clear search", the product
  // page's breadcrumb, or the Back button.
  const navigated = useRef(urlQuery)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelDebounce = () => {
    if (timer.current === null) return
    clearTimeout(timer.current)
    timer.current = null
  }

  useEffect(() => {
    if (urlQuery === navigated.current) return
    navigated.current = urlQuery
    setQuery(urlQuery)
  }, [urlQuery])

  useEffect(() => cancelDebounce, [])

  const navigate = (nextQuery: string, nextCategory: string) => {
    cancelDebounce()
    const trimmed = nextQuery.trim()
    navigated.current = trimmed
    start(() => {
      setCategory(nextCategory)
      router.replace(searchHref(trimmed, nextCategory), { scroll: false })
    })
  }

  const onQueryChange = (value: string) => {
    setQuery(value)
    cancelDebounce()
    const trimmed = value.trim()
    // Emptying the field, including through the search input's own clear
    // button, goes back to the default state.
    if (trimmed === '') {
      if (navigated.current !== '' || urlCategory !== ALL_CATEGORIES) {
        navigate('', ALL_CATEGORIES)
      }
      return
    }
    // One or two characters match too much to be worth a request; the previous
    // results stay on screen until the query is worth running or is submitted.
    if (trimmed.length < MIN_AUTO_LENGTH || trimmed === navigated.current) return
    timer.current = setTimeout(() => navigate(trimmed, urlCategory), DEBOUNCE_MS)
  }

  return (
    <SearchFormFields
      categories={categories}
      query={query}
      category={category}
      pending={isPending}
      onSubmit={(event) => {
        event.preventDefault()
        navigate(query, urlCategory)
      }}
      onQueryChange={onQueryChange}
      onCategoryChange={(value) => navigate(query, value)}
    />
  )
}
