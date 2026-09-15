import type { Product } from './api/types'
import { decimalAmount } from './format'
import type { StockAvailability } from './stock-status'

/** A JSON-LD document; plain data, typed loosely on purpose (no schema-dts dependency). */
export type JsonLd = Record<string, unknown>

/** One breadcrumb step: a visible name and a site-relative link. */
export interface Crumb {
  name: string
  href: string
}

const BRAND = 'Vercel Swag Store'

/**
 * schema.org `Product` with its `Offer`. Price in major units as a decimal
 * string; `availability` comes from live stock and is left out when stock is
 * unknown, which schema.org allows.
 */
export function productJsonLd({
  product,
  availability,
  siteUrl,
}: {
  product: Product
  availability: StockAvailability | null
  siteUrl: string
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.id,
    brand: { '@type': 'Brand', name: BRAND },
    offers: {
      '@type': 'Offer',
      url: new URL(`/products/${product.slug}`, siteUrl).href,
      price: decimalAmount(product.price),
      priceCurrency: product.currency,
      ...(availability ? { availability } : {}),
    },
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
