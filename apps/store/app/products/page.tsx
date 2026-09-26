import type { Metadata } from 'next'
import { ProductListing } from '@/components/listing/product-listing'
import { LISTING_FALLBACK } from '@/lib/content/fallbacks'
import { markdownAlternate } from '@/lib/markdown/paths'
import { getSiteSettings, getSiteSettingsForMetadata } from '@/lib/sanity/content'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettingsForMetadata()
  return {
    title: 'All products',
    description: settings?.productListing?.intro || LISTING_FALLBACK.intro,
    alternates: markdownAlternate('/products'),
  }
}

/** The whole catalogue, prerendered. */
export default async function ProductsPage() {
  const settings = await getSiteSettings()
  return (
    <ProductListing
      category={null}
      intro={settings?.productListing?.intro || LISTING_FALLBACK.intro}
    />
  )
}
