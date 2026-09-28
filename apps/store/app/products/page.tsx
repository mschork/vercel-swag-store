import type { Metadata } from 'next'
import { ProductListing } from '@/components/listing/product-listing'
import { listingIntro } from '@/lib/content/fallbacks'
import { markdownAlternate } from '@/lib/markdown/paths'
import { getSiteSettings, getSiteSettingsForMetadata } from '@/lib/sanity/content'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettingsForMetadata()
  return {
    title: 'All products',
    description: listingIntro(null, settings?.productListing?.intro),
    alternates: markdownAlternate('/products'),
  }
}

/** The whole catalogue, prerendered. */
export default async function ProductsPage() {
  const settings = await getSiteSettings()
  return (
    <ProductListing category={null} intro={listingIntro(null, settings?.productListing?.intro)} />
  )
}
