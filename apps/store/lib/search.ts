import type { Category, Product } from '@/lib/api/types'

/** Longest query searched; longer input is truncated to this. */
const MAX_QUERY_LENGTH = 64

/** How many results the requirements allow on the page. */
export const RESULT_CAP = 5

/** The query as it is searched and recorded. Empty means "no query". */
export function normaliseQuery(raw: string | undefined | null): string {
  return (raw ?? '').trim().slice(0, MAX_QUERY_LENGTH)
}

/** What a result needs to be placed: its id and its category. */
interface Placed {
  id: string
  category: string
}

/** The fields a query is matched against: the ones the API's `search` reads. */
export interface Searchable extends Placed {
  name: string
  description: string
  tags: readonly string[]
}

/**
 * Whether a product matches a query the way the API's `search` does: the
 * query, ignoring case, is a substring of the name, the description or a tag.
 * `search-parity.test.ts` holds this against the API's own answers.
 */
export function matchesQuery(product: Searchable, query: string): boolean {
  const needle = query.toLowerCase()
  return (
    product.name.toLowerCase().includes(needle) ||
    product.description.toLowerCase().includes(needle) ||
    product.tags.some((tag) => tag.toLowerCase().includes(needle))
  )
}

/** What the results region shows for one search. */
export interface SearchOutcome {
  /** Product ids in display order, at most `RESULT_CAP`. */
  ids: string[]
  heading: string
  /** "Includes everything in {Category}", when the grid holds all of it. */
  hint: string | null
  /** The cap cut results, so narrowing by category is worth suggesting. */
  capped: boolean
}

const countLabel = (count: number) =>
  `${count} ${count === 1 ? 'result' : 'results'}`

/** A plain filter: the first `RESULT_CAP`, and how many there were. */
function plain(matches: readonly Placed[]): SearchOutcome {
  const ids = matches.slice(0, RESULT_CAP).map((product) => product.id)
  const capped = matches.length > ids.length
  return {
    ids,
    heading: capped
      ? `Showing ${ids.length} of ${matches.length} results`
      : countLabel(ids.length),
    hint: null,
    capped,
  }
}

/**
 * One search over the whole catalogue, in the catalogue's order, which is the
 * order the API answers in. Four routes, chosen by what is set. A query with
 * no category is the one that needs help: a category name matches no product
 * text, so "hats" finds nothing while the Hats category holds products. When
 * the query names a category, its products are merged in behind the hits.
 * `featuredIds` is the default state, shown when nothing is set, under
 * `featuredHeading`.
 */
export function searchCatalogue({
  query,
  category,
  catalogue,
  categories,
  featuredIds,
  featuredHeading = '',
}: {
  query: string
  category: Category | null
  catalogue: readonly Searchable[]
  categories: readonly Category[]
  featuredIds: readonly string[]
  featuredHeading?: string
}): SearchOutcome {
  if (!query && !category) {
    const ids = featuredIds.slice(0, RESULT_CAP)
    return { ids, heading: featuredHeading, hint: null, capped: false }
  }
  const inCategory = (slug: string) =>
    catalogue.filter((product) => product.category === slug)
  if (!query && category) return plain(inCategory(category.slug))
  const hits = catalogue.filter((product) => matchesQuery(product, query))
  if (category) return plain(hits.filter((product) => product.category === category.slug))

  const matched = expandQuery(query, categories)
  if (!matched) return plain(hits)
  const merged = mergeResults(
    hits.slice(0, RESULT_CAP),
    inCategory(matched.slug).slice(0, RESULT_CAP),
    matched.slug,
  )
  return {
    ids: merged.products.map((product) => product.id),
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
export interface MergedResults<T extends Placed = Product> {
  products: T[]
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
export function mergeResults<T extends Placed>(
  searchHits: readonly T[],
  categoryItems: readonly T[],
  categorySlug: string,
  cap: number = RESULT_CAP,
): MergedResults<T> {
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
