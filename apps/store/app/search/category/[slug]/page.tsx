import type { Metadata } from 'next'
import { SearchView } from '@/components/search/search-view'
import { getCategories } from '@/lib/api/categories'

type Props = PageProps<'/search/category/[slug]'>

/**
 * `/search?category=<slug>` with no query, prerendered once per category.
 * `next.config.ts` rewrites that URL here, so the address bar keeps the
 * search URL and the form reads its state from it as on `/search`. Categories
 * are a closed set, so every one of these pages is served whole from the CDN;
 * a text query has unbounded values and stays on `/search`. An unknown slug
 * renders on request and shows the default results, as `/search` does.
 */
export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map(({ slug }) => ({ slug }))
}

/** The same as `/search` without a query. */
export const metadata: Metadata = { title: 'Search', description: null }

export default function SearchCategoryPage({ params }: Props) {
  return <SearchView searchParams={params.then(({ slug }) => ({ category: slug }))} />
}
