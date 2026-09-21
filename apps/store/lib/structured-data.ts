import type { Product } from './api/types'
import { decimalAmount } from './format'
import { portableTextToPlainText } from './markdown/portable-text'

/** A JSON-LD document; plain data, loosely typed to avoid a schema-dts dependency. */
export type JsonLd = Record<string, unknown>

/** One breadcrumb step: a visible name and a site-relative link. */
export interface Crumb {
  name: string
  href: string
}

/**
 * What the catalogue says the products are. A brand is a fact about a
 * product; the markup names no organisation, seller or publisher, which would
 * be claims about who runs the site (specs/E20-ai-crawlers.md).
 */
const BRAND = 'Vercel'

const productUrl = (slug: string, siteUrl: string) => new URL(`/products/${slug}`, siteUrl).href

/**
 * schema.org `Product` with its `Offer`. Price in major units as a decimal
 * string. Never `availability`: stock is a per-visitor draw
 * (docs/adr/0006-the-stable-visit.md), and this is the same for everyone.
 */
export function productJsonLd({
  product,
  images,
  categoryName,
  siteUrl,
}: {
  product: Product
  /** Absolute photo URLs, the API's first. */
  images: readonly string[]
  categoryName: string
  siteUrl: string
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: images,
    sku: product.id,
    category: categoryName,
    brand: { '@type': 'Brand', name: BRAND },
    offers: {
      '@type': 'Offer',
      url: productUrl(product.slug, siteUrl),
      price: decimalAmount(product.price),
      priceCurrency: product.currency,
    },
  }
}

/** schema.org `FAQPage`; answers are the rich text's plain text. */
export function faqJsonLd(faqs: readonly { question: string; answer: unknown }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: portableTextToPlainText(faq.answer) },
    })),
  }
}

/** schema.org `ItemList` of product pages, in the order the listing shows them. */
export function itemListJsonLd({
  name,
  products,
  siteUrl,
}: {
  name: string
  products: readonly Pick<Product, 'name' | 'slug'>[]
  siteUrl: string
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: productUrl(product.slug, siteUrl),
    })),
  }
}

/** schema.org `WebSite`: the store's name and address, nothing about who runs it. */
export function webSiteJsonLd({ name, siteUrl }: { name: string; siteUrl: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: new URL('/', siteUrl).href,
  }
}

/** schema.org `BreadcrumbList` with absolute URLs, in the order shown on the page. */
export function breadcrumbJsonLd(
  crumbs: readonly Crumb[],
  siteUrl: string,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: new URL(crumb.href, siteUrl).href,
    })),
  }
}

/**
 * JSON for an inline `<script type="application/ld+json">`. Every `<` becomes
 * `<`, so no value from the API can close the script element, and the
 * result is still valid JSON. That is what lets `JsonLd` render it as a text
 * child: `dangerouslySetInnerHTML` is a lint error here
 * (docs/adr/0001-csp-unsafe-inline-scripts.md).
 */
export function serializeJsonLd(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
