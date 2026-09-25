import type { ReactNode } from 'react'
import { ProductCard } from '@/components/product-card'
import { gridVariant } from '@/components/grid-variants'
import { getCategories } from '@/lib/api/categories'
import { getAllProducts, getFeaturedProducts } from '@/lib/api/products'
import { SEARCH_FALLBACK } from '@/lib/content/fallbacks'
import { getSiteSettings } from '@/lib/sanity/content'
import { RESULT_CAP } from '@/lib/search'
import { SearchStateProvider } from './search-state'

/**
 * Loads the whole catalogue into the search page's shell, so the browser
 * searches it without a request. Every read is cached, so this is part of
 * the prerender. The catalogue is small enough to send whole; a catalogue of
 * thousands would search on the server instead.
 */
export async function SearchCatalogue({ children }: { children: ReactNode }) {
  const [catalogue, featured, categories, settings] = await Promise.all([
    getAllProducts(),
    getFeaturedProducts({ limit: RESULT_CAP, min: RESULT_CAP }),
    getCategories(),
    getSiteSettings(),
  ])
  const nameOf = (slug: string) =>
    categories.find((category) => category.slug === slug)?.name ?? slug
  const { sizes } = gridVariant('search')
  const cards = Object.fromEntries(
    catalogue.map((product) => [
      product.id,
      <ProductCard
        key={product.id}
        product={product}
        categoryName={nameOf(product.category)}
        sizes={sizes}
      />,
    ]),
  )
  const entries = catalogue.map(({ id, name, description, tags, category }) => ({
    id,
    name,
    description,
    tags,
    category,
  }))
  return (
    <SearchStateProvider
      catalogue={{
        entries,
        featuredIds: featured.map((product) => product.id),
        featuredHeading:
          settings?.searchPage?.featuredHeading || SEARCH_FALLBACK.featuredHeading,
        categories,
        cards,
      }}
    >
      {children}
    </SearchStateProvider>
  )
}
