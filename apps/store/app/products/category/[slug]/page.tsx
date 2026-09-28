import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductListing } from '@/components/listing/product-listing'
import { findCategory, getCategories } from '@/lib/api/categories'
import { listingIntro } from '@/lib/content/fallbacks'
import { categoryPath } from '@/lib/listing'
import { markdownAlternate } from '@/lib/markdown/paths'
import {
  getCategoryDocument,
  getCategoryDocumentForMetadata,
} from '@/lib/sanity/content'

type Props = PageProps<'/products/category/[slug]'>

/**
 * One page per category the API lists. Categories are a closed set, which is
 * why this is a path and search's free text is a param
 * (specs/E18-product-listing.md). A category the API gains after the build
 * renders on its first request; a slug it does not know gets the not-found
 * page.
 */
export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map(({ slug }) => ({ slug }))
}

/**
 * The category and its Sanity document, settled above any boundary, so an
 * unknown slug is a real 404, as in `productFor` on the product page. The
 * document is read by the requested slug beside the category, not after it.
 */
async function categoryFor(
  params: Props['params'],
  documentFor: typeof getCategoryDocument,
) {
  const { slug } = await params
  const [category, document] = await Promise.all([findCategory(slug), documentFor(slug)])
  if (!category) notFound()
  return { category, document }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, document } = await categoryFor(params, getCategoryDocumentForMetadata)
  return {
    title: category.name,
    // The editor's intro when there is one; read without stega, because a
    // description is exported to machines.
    description: listingIntro(category, document?.intro),
    alternates: markdownAlternate(categoryPath(category.slug)),
  }
}

/**
 * The intro comes from the cached Sanity read; a missing document or a failed
 * call is `null`, and the page then shows the fallback intro.
 */
export default async function CategoryPage({ params }: Props) {
  const { category, document } = await categoryFor(params, getCategoryDocument)
  return (
    <ProductListing category={category} intro={listingIntro(category, document?.intro)} />
  )
}
