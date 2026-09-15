import type { Product } from '@/lib/api/types'
import { GalleryImage } from './gallery-image'
import { GalleryThumbnails } from './gallery-thumbnails'

/**
 * The product photos. With one image, which is every API product today, this
 * stays a server component. Thumbnails and their client-side selection render
 * only when there is more than one image.
 */
export function ProductGallery({ product }: { product: Product }) {
  if (product.images.length > 1) {
    return <GalleryThumbnails images={product.images} name={product.name} />
  }
  return <GalleryImage src={product.images[0]} alt={product.name} preload />
}
