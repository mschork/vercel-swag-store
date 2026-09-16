import type { Category, Product } from '@/lib/api/types'

/** Longest query sent to the API; longer input is a paste or an attack, not a search. */
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

/** True when `haystack` contains `needle` bounded by non-word characters. */
function containsWord(haystack: string, needle: string): boolean {
  return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(needle)}(?:[^a-z0-9]|$)`, 'i').test(haystack)
}

/**
 * The category a query names, or `null`. The API's `search` is a substring
 * match over product `name` and `description` only: `search=hats` returns
 * nothing, because no product says "hats". So the singular and plural of a
 * category name are matched here instead, against the slug and the display
 * name.
 *
 * `norm` drops one trailing "s" so "hats" and "hat" ask the same question;
 * both forms are then compared. The whole-word test is what reaches "t-shirts"
 * from "shirt": the hyphen is a boundary, so "shirts" is a word inside it.
 */
export function expandQuery(
  query: string,
  categories: readonly Category[],
): Category | null {
  const norm = query.trim().toLowerCase().replace(/s$/, '')
  if (!norm) return null
  const plural = `${norm}s`
  return (
    categories.find((category) => {
      const slug = category.slug.toLowerCase()
      const name = category.name.toLowerCase()
      if (slug === norm || slug === plural || name === norm || name === plural) {
        return true
      }
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
 * Search hits first, then the category's products that the search missed, cut
 * to `cap`. `added` and `truncated` drive the heading and the hint: the hint
 * may only promise "everything in {Category}" when the category contributed
 * something *and* nothing was cut, or it would name products the grid does not
 * show.
 */
export function mergeResults(
  searchHits: readonly Product[],
  categoryItems: readonly Product[],
  cap: number = RESULT_CAP,
): MergedResults {
  const seen = new Set(searchHits.map((product) => product.id))
  const extras = categoryItems.filter((product) => !seen.has(product.id))
  const merged = [...searchHits, ...extras]
  const products = merged.slice(0, cap)
  return {
    products,
    added: products.some((product) => !seen.has(product.id)),
    truncated: merged.length > products.length,
  }
}
