import type { Category, Product } from '@/lib/api/types'

/** Longest query sent to the API; longer input is truncated to this. */
const MAX_QUERY_LENGTH = 64

/** How many results the requirements allow on the page. */
export const RESULT_CAP = 5

/**
 * The query as it reaches the API. Empty means "no query": the API answers 422
 * for `search=`, so an empty string must never be sent.
 */
export function normaliseQuery(raw: string | undefined | null): string {
  return (raw ?? '').trim().slice(0, MAX_QUERY_LENGTH)
}

/** Escapes a user string so it can sit inside a `RegExp` literal. */
const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Letters and digits only, so "t-shirts", "T Shirts" and "tshirts" compare equal. */
const squash = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

/** True when `haystack` contains `needle` bounded by non-word characters. */
function containsWord(haystack: string, needle: string): boolean {
  return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}(?:[^a-z0-9]|$)`, 'i').test(haystack)
}

/**
 * The category a query names, or `null`. The API's `search` is a literal
 * substring match over product `name`, `description` and `tags`, so a category
 * name returns nothing; singular and plural are matched here instead, against
 * the slug and the display name. The equality test squashes hyphens and spaces
 * out of both sides; the whole-word test keeps the raw text, where the hyphen
 * is the boundary that finds "shirt" inside "t-shirts".
 */
export function expandQuery(
  query: string,
  categories: readonly Category[],
): Category | null {
  const norm = query.trim().toLowerCase().replace(/s$/, '')
  if (!norm) return null
  const plural = `${norm}s`
  const squashed = new Set([squash(norm), squash(plural)])
  return (
    categories.find((category) => {
      const slug = category.slug.toLowerCase()
      const name = category.name.toLowerCase()
      if (squashed.has(squash(slug)) || squashed.has(squash(name))) return true
      return (
        containsWord(slug, norm) ||
        containsWord(slug, plural) ||
        containsWord(name, norm) ||
        containsWord(name, plural)
      )
    }) ?? null
  )
}

/** A merged result set plus what the merge had to do to fit the cap. */
export interface MergedResults {
  products: Product[]
  /** The category call contributed at least one product the search missed. */
  added: boolean
  /** The cap dropped at least one product that would otherwise show. */
  truncated: boolean
}

/**
 * Three groups, in this order: the search hits in the matched category, the
 * category's other products, then the remaining hits, cut to `cap`. The
 * category outranks the API's own order, which matches substrings anywhere in
 * the prose; the cost is that a category product can take a slot a text match
 * would otherwise hold. `added` and `truncated` let the hint promise
 * "everything in {Category}" only when the category added something and
 * nothing was cut.
 */
export function mergeResults(
  searchHits: readonly Product[],
  categoryItems: readonly Product[],
  categorySlug: string,
  cap: number = RESULT_CAP,
): MergedResults {
  const seen = new Set(searchHits.map((product) => product.id))
  const inCategory = searchHits.filter(
    (product) => product.category === categorySlug,
  )
  const elsewhere = searchHits.filter(
    (product) => product.category !== categorySlug,
  )
  const extras = categoryItems.filter((product) => !seen.has(product.id))
  const merged = [...inCategory, ...extras, ...elsewhere]
  const products = merged.slice(0, cap)
  return {
    products,
    added: products.some((product) => !seen.has(product.id)),
    truncated: merged.length > products.length,
  }
}
