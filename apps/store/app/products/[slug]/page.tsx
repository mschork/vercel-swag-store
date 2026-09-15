import { getAllProductSlugs } from '@/lib/api/products'

/**
 * Stub so `typedRoutes` accepts links to `/products/[slug]`; E05 provides the
 * page. It never reads `params`. `generateStaticParams` is pulled forward from
 * E05 so the listed slugs prerender; any other slug gets the fallback shell,
 * whose header nav streams in (see components/header.tsx).
 */
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default function ProductPage() {
  return <h1 className="py-12 text-2xl font-medium">Product</h1>
}
