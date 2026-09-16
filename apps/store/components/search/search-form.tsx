import { Suspense } from 'react'
import { getCategories } from '@/lib/api/categories'
import { SearchFormClient } from './search-form-client'
import { SearchFormFields } from './search-form-fields'

/**
 * The form in the static shell. Categories come from the cached API list, so
 * this renders at build time; the live leaf reads `useSearchParams` and is
 * therefore dynamic, which under Cache Components means it must sit inside a
 * boundary or the build fails.
 *
 * The fallback is the same markup without values or handlers: identical
 * layout, and, because nothing replaces it when JavaScript never runs, the
 * plain GET form that makes `/search` work without it.
 */
export async function SearchForm() {
  const categories = await getCategories()
  return (
    <Suspense fallback={<SearchFormFields categories={categories} />}>
      <SearchFormClient categories={categories} />
    </Suspense>
  )
}
