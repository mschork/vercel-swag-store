import { findCategory, getCategories } from '@/lib/api/categories'
import { getProductsInCategory } from '@/lib/api/products'
import { publicEnv } from '@/lib/env.public'
import { listingMarkdown } from '@/lib/markdown/render'
import { markdownNotFound, markdownResponse } from '@/lib/markdown/response'
import { getCategoryDocumentForMetadata } from '@/lib/sanity/content'

/** One file per category the API lists, built ahead like the category pages. */
export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map(({ slug }) => ({ slug }))
}

/** `/products/category/<slug>.md`; an unknown slug is a 404. */
export async function GET(_request: Request, { params }: RouteContext<'/md/category/[slug]'>) {
  const { slug } = await params
  const category = await findCategory(slug)
  if (!category) return markdownNotFound()
  const [products, categories, document] = await Promise.all([
    getProductsInCategory(category.slug),
    getCategories(),
    getCategoryDocumentForMetadata(category.slug),
  ])
  const body = listingMarkdown({
    category,
    intro: document?.intro,
    products,
    categories,
    siteUrl: publicEnv.NEXT_PUBLIC_SITE_URL,
  })
  return markdownResponse(body, `/products/category/${category.slug}`)
}
