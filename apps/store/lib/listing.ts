import type { Route } from 'next'

/**
 * A category's listing page. The one cast lives here: with two dynamic routes
 * under `/products`, typed routes cannot infer which one a template string
 * with a plain `string` slug belongs to, though the route exists.
 */
export function categoryPath(slug: string): Route {
  return `/products/category/${encodeURIComponent(slug)}` as Route
}

/** The sort orders the product listing offers. */
export const SORT_ORDERS = ['default', 'price-asc', 'price-desc'] as const

export type SortOrder = (typeof SORT_ORDERS)[number]

/** The option's label, and the sentence announced once it is applied. */
export const SORT_LABELS: Record<SortOrder, { option: string; announcement: string }> = {
  default: { option: 'Default', announcement: 'Sorted in the default order' },
  'price-asc': { option: 'Price: low to high', announcement: 'Sorted by price, low to high' },
  'price-desc': { option: 'Price: high to low', announcement: 'Sorted by price, high to low' },
}

export function isSortOrder(value: string): value is SortOrder {
  return (SORT_ORDERS as readonly string[]).includes(value)
}

/**
 * A sorted copy; the input is the API's order and is never mutated, which is
 * what lets "Default" restore it. The sort is stable, so equal prices keep the
 * API's order in both directions.
 */
export function sortProducts<T extends { price: number }>(
  items: readonly T[],
  order: SortOrder,
): T[] {
  const copy = [...items]
  if (order === 'default') return copy
  const direction = order === 'price-asc' ? 1 : -1
  return copy.sort((a, b) => direction * (a.price - b.price))
}

/** "1 product", "12 products": the count is the length of what is rendered. */
export function productCountLabel(count: number): string {
  return count === 1 ? '1 product' : `${count} products`
}
