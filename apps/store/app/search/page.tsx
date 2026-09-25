import type { Metadata } from 'next'
import { SearchView } from '@/components/search/search-view'
import { normaliseQuery } from '@/lib/search'

type Props = PageProps<'/search'>

/**
 * Awaits `searchParams`, so the metadata streams in rather than being part of
 * the prerender; the page itself stays a partial prerender. Results are never
 * indexed: they are a slice of the catalogue under an arbitrary URL, and the
 * product pages are the pages worth finding. The description is rendered by
 * `SearchView`, so this leaves it out.
 */
export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q } = await searchParams
  const query = normaliseQuery(Array.isArray(q) ? q[0] : q)
  return query
    ? { title: `Results for "${query}"`, description: null, robots: { index: false } }
    : { title: 'Search', description: null }
}

/**
 * The search page for a query. A category with no query never reaches it:
 * `next.config.ts` rewrites that URL to `/search/category/[slug]`, which is
 * prerendered.
 */
export default function SearchPage({ searchParams }: Props) {
  return <SearchView searchParams={searchParams} />
}
