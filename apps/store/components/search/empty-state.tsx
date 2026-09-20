import Link from 'next/link'
import { EmptyState as Frame } from '@/components/empty-state'
import type { Category } from '@/lib/api/types'

/**
 * Nothing came back. Three shapes, one component, because they differ only in
 * the sentence and the way out: with a query, the way out is a wider search;
 * with a category alone, there is nothing to widen, only somewhere else to go.
 * Every variant ends in the category chips, which are the one thing that is
 * always worth offering.
 */
export function EmptyState({
  query,
  category,
  categories,
}: {
  query: string
  category: Category | null
  categories: readonly Category[]
}) {
  return (
    <Frame title={headline(query, category)}>
      {query && category ? (
        <Link
          href={`/search?q=${encodeURIComponent(query)}`}
          className="underline underline-offset-4"
        >
          Search all categories
        </Link>
      ) : null}
      <div className="flex flex-col gap-3">
        <p className="text-sm text-fg-secondary">Browse a category</p>
        <ul className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/search?category=${encodeURIComponent(item.slug)}`}
                className="inline-flex rounded-full border border-border px-3 py-1.5 text-sm hover:border-border-strong"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {query && !category ? (
        <>
          <Link href="/search" className="underline underline-offset-4">
            Clear search
          </Link>
          {/* The miss is counted (lib/search/record-gap.ts), so say so. */}
          <p className="text-sm text-fg-secondary">
            We keep track of what people look for and don&apos;t find.
          </p>
        </>
      ) : null}
    </Frame>
  )
}

function headline(query: string, category: Category | null): string {
  if (query && category) return `No products match "${query}" in ${category.name}`
  if (query) return `No products match "${query}"`
  return `Nothing in ${category?.name ?? 'this category'} right now`
}
