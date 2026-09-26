import Link from 'next/link'
import { Container } from '@/components/container'
import { EmptyState } from '@/components/empty-state'
import { JsonLd } from '@/components/json-ld'
import { SortableProductGrid } from '@/components/product-grid'
import { getCategories } from '@/lib/api/categories'
import { getAllProducts, getProductsInCategory } from '@/lib/api/products'
import type { Category } from '@/lib/api/types'
import { publicEnv } from '@/lib/env.public'
import { categoryPath, productCountLabel } from '@/lib/listing'
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/structured-data'
import { CategoryChips } from './category-chips'

/** The first row at the widest grid; on these pages the grid is the largest paint. */
const PRELOAD_COUNT = 4

/**
 * The product listing: every product, or one category's
 * (specs/E18-product-listing.md). Everything it reads is cached catalogue
 * data, and nothing here reads the request, so both routes that render it are
 * prerendered whole. The intro is the one editorial line, always present, so
 * the heading block keeps its height from one category to the next; two
 * lines are reserved, and a longer intro pushes the chips down.
 */
export async function ProductListing({
  category,
  intro,
}: {
  category: Category | null
  /** The listing intro: the editor's, or its fallback. */
  intro: string
}) {
  const [products, categories] = await Promise.all([
    category ? getProductsInCategory(category.slug) : getAllProducts(),
    getCategories(),
  ])
  const name = category ? category.name : 'All products'
  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL
  return (
    <Container className="flex flex-col gap-6 py-8 md:gap-8 md:py-12">
      <JsonLd data={itemListJsonLd({ name, products, siteUrl })} />
      {category ? (
        <JsonLd
          data={breadcrumbJsonLd(
            [
              { name: 'Home', href: '/' },
              { name: category.name, href: categoryPath(category.slug) },
            ],
            siteUrl,
          )}
        />
      ) : null}
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-medium tracking-tight">{name}</h1>
        <p className="min-h-12 max-w-prose text-pretty text-fg-secondary">{intro}</p>
      </div>
      <CategoryChips categories={categories} current={category?.slug ?? null} />
      {products.length > 0 ? (
        <SortableProductGrid
          products={products}
          variant="listing"
          summary={productCountLabel(products.length)}
          preloadCount={PRELOAD_COUNT}
        />
      ) : (
        <EmptyState title={`Nothing in ${category?.name ?? 'the store'} right now`}>
          <Link href="/products" className="underline underline-offset-4">
            See all products
          </Link>
        </EmptyState>
      )}
    </Container>
  )
}
