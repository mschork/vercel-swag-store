import type { Metadata } from 'next'
import { ProductListing } from '@/components/listing/product-listing'

export const metadata: Metadata = {
  title: 'All products',
  description: 'Browse every product in the store.',
}

/** The whole catalogue, prerendered. */
export default function ProductsPage() {
  return <ProductListing category={null} />
}
