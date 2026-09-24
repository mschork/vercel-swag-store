import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Container } from '@/components/container'
import { Price } from '@/components/price'
import { JsonLd } from '@/components/json-ld'
import {
  Breadcrumb,
  type BreadcrumbLink,
} from '@/components/product/breadcrumb'
import {
  About,
  Care,
  Faqs,
  Testimonials,
} from '@/components/product/enrichment'
import { ProductGallery } from '@/components/product/gallery'
import { StockAndCart } from '@/components/product/stock-and-cart'
import { StockSkeleton } from '@/components/product/stock-skeleton'
import { getAllProductSlugs } from '@/lib/api/products'
import { getStoreConfig } from '@/lib/api/store'
import { publicEnv } from '@/lib/env.public'
import { categoryPath } from '@/lib/listing'
import { markdownAlternate } from '@/lib/markdown/paths'
import { openGraphDefaults } from '@/lib/metadata'
import { getProductView } from '@/lib/product-view'
import { photoUrls } from '@/lib/sanity/image'
import { breadcrumbJsonLd, faqJsonLd, productJsonLd } from '@/lib/structured-data'
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
 * What this URL's page says (`getProductView`), or the not-found page. Awaited
 * above any Suspense boundary: an unknown slug is then settled before the
 * response starts streaming, so it gets a real 404 status instead of a 200
 * with a noindex tag.
 */
async function viewFor(params: Props['params']) {
  const { slug } = await params
  const view = await getProductView(slug)
  if (!view) notFound()
  return view
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ product }, { storeName }] = await Promise.all([viewFor(params), getStoreConfig()])
  const description = truncate(product.description, 160)
  // The Open Graph image comes from ./opengraph-image.tsx; Next adds it.
  return {
    title: product.name,
    description,
    alternates: markdownAlternate(`/products/${product.slug}`),
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
  const { product, categoryName, testimonials: entries, headings } = await viewFor(params)
  // Without editorial content the wrapper is not rendered at all rather than
  // left empty, so the page's spacing is unchanged.
  const enriched =
    Boolean(product.extendedDescription) ||
    Boolean(product.care) ||
    entries.length > 0 ||
    product.faqs.length > 0
  const photos = photoUrls(product.gallery)
  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL
  const trail: BreadcrumbLink[] = [
    { name: 'Home', href: '/' },
    {
      name: categoryName,
      href: categoryPath(product.category),
    },
  ]
  const crumbs = [
    ...trail,
    { name: product.name, href: `/products/${product.slug}` },
  ]

  return (
    <Container className="flex flex-col gap-6 py-8 md:gap-8 md:py-12">
      <Breadcrumb trail={trail} current={product.name} />
      <JsonLd data={breadcrumbJsonLd(crumbs, siteUrl)} />
      {/* In the prerendered part of the page, so it is the same for everyone. */}
      <JsonLd data={productJsonLd({ product, images: photos, categoryName, siteUrl })} />
      {product.faqs.length > 0 ? <JsonLd data={faqJsonLd(product.faqs)} /> : null}
      <article className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div>
          <ProductGallery images={photos} name={product.name} />
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-medium tracking-tight text-balance">
              {product.name}
            </h1>
            <p>
              <Price cents={product.price} currency={product.currency} size="lg" />
            </p>
          </div>
          <p className="max-w-prose text-base text-fg-secondary">{product.description}</p>
          <Suspense fallback={<StockSkeleton />}>
            <StockAndCart product={product} />
          </Suspense>
        </div>
      </article>
      {enriched ? (
        <div className="flex flex-col gap-8">
          {/* People first: the buy panel already carries the short description,
              so the photo and quote follow it and the reference text comes after. */}
          <Testimonials entries={entries} heading={headings.testimonials} />
          <About text={product.extendedDescription} heading={headings.about} />
          <Care text={product.care} heading={headings.care} />
          <Faqs faqs={product.faqs} heading={headings.faq} />
        </div>
      ) : null}
    </Container>
  )
}
