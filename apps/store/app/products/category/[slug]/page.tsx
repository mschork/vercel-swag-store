import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductListing } from '@/components/listing/product-listing'
import { findCategory, getCategories } from '@/lib/api/categories'
import {
  getCategoryDocument,
  getCategoryDocumentForMetadata,
} from '@/lib/sanity/content'

type Props = PageProps<'/products/category/[slug]'>

/**
 * One page per category the API lists. Categories are a closed set, which is
 * why this is a path and search's free text is a param
 * (specs/E18-product-listing.md). A category the API gains after the build
 * renders on its first request; a slug it does not know gets the not-found page.
 */
export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map(({ slug }) => ({ slug }))
}

/** Settled above any boundary, so an unknown slug is a real 404 (as on the product page). */
async function categoryFor(params: Props['params']) {
  const { slug } = await params
  const category = await findCategory(slug)
  if (!category) notFound()
  return category
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await categoryFor(params)
  const document = await getCategoryDocumentForMetadata(category.slug)
  return {
    title: category.name,
    // The editor's intro when there is one; read without stega, because a
    // description is exported to machines (E17).
    description: document?.intro || `Browse all ${category.name} in the store.`,
  }
}

/**
 * The intro comes from the cached Sanity read; a missing document or a failed
 * call is `null`, and the page is then exactly the API-only listing.
 */
export default async function CategoryPage({ params }: Props) {
  const category = await categoryFor(params)
  const document = await getCategoryDocument(category.slug)
  return <ProductListing category={category} intro={document?.intro} />
}
