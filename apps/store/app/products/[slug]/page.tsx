import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { JsonLd } from '@/components/json-ld'
import {
  Breadcrumb,
  type BreadcrumbLink,
} from '@/components/product/breadcrumb'
import { ProductGallery } from '@/components/product/gallery'
import {
  StockAndCart,
  StockSkeleton,
} from '@/components/product/stock-and-cart'
import { findCategory } from '@/lib/api/categories'
import { findProduct, getAllProductSlugs } from '@/lib/api/products'
import { getStoreConfig } from '@/lib/api/store'
import { publicEnv } from '@/lib/env.public'
import { formatPrice } from '@/lib/format'
import { openGraphDefaults } from '@/lib/metadata'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { truncate } from '@/lib/text'

type Props = PageProps<'/products/[slug]'>

/**
 * Every product page is prerendered. A slug the API gains after the build
 * renders on its first request; one it does not know gets the not-found page.
 */
export async function generateStaticParams() {
  const slugs = await getAllProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

/**
 * The product for this URL, or the not-found page. Awaited above any Suspense
 * boundary on purpose: an unknown slug is then settled before the response
 * starts streaming, so it gets a real 404 status instead of a 200 with a
 * noindex tag. The cost is that such a URL renders on the server before its
 * first byte instead of from a prerendered shell; every real product is
 * prerendered, so only mistyped or removed URLs pay it.
 */
async function productFor(params: Props['params']) {
  const { slug } = await params
  const product = await findProduct(slug)
  if (!product) notFound()
  return product
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [product, { storeName }] = await Promise.all([
    productFor(params),
    getStoreConfig(),
  ])
  const description = truncate(product.description, 160)
  // The Open Graph image comes from ./opengraph-image.tsx; Next adds it.
  return {
    title: product.name,
    description,
    openGraph: {
      ...openGraphDefaults(storeName),
      title: product.name,
      description,
      url: `/products/${product.slug}`,
    },
  }
}

/**
 * Product, category and store data are cached, so for every listed slug the
 * page is prerendered; live stock is its only dynamic hole.
 */
export default async function ProductPage({ params }: Props) {
  const product = await productFor(params)
  const category = await findCategory(product.category)
  const categoryName = category?.name ?? product.category
  const trail: BreadcrumbLink[] = [
    { name: 'Home', href: '/' },
    {
      name: categoryName,
      href: `/search?category=${encodeURIComponent(product.category)}`,
    },
  ]
  const crumbs = [
    ...trail,
    { name: product.name, href: `/products/${product.slug}` },
  ]

  return (
    <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-10">
      <Breadcrumb trail={trail} current={product.name} />
      <JsonLd data={breadcrumbJsonLd(crumbs, publicEnv.NEXT_PUBLIC_SITE_URL)} />
      <article className="grid gap-8 md:grid-cols-2 md:gap-12">
        <ProductGallery product={product} />
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-medium tracking-tight text-balance md:text-4xl">
              {product.name}
            </h1>
            <p className="text-xl tabular-nums">
              {formatPrice(product.price, product.currency)}
            </p>
          </div>
          <p className="max-w-prose text-fg-secondary">{product.description}</p>
          <Suspense fallback={<StockSkeleton />}>
            <StockAndCart product={product} />
          </Suspense>
        </div>
      </article>
    </div>
  )
}
