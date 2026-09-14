import Image from 'next/image'
import type { Product } from '@/lib/api/types'

/**
 * A product's first photo, filling its parent (which sets the frame and the
 * aspect). `alt` is empty where the surrounding link already names the
 * product (cards) and the product name where the image is the link's only
 * content (hero). Renders nothing for a product without images.
 */
export function ProductImage({
  product,
  sizes,
  alt,
  priority = false,
}: {
  product: Product
  sizes: string
  alt: string
  priority?: boolean
}) {
  const src = product.images[0]
  if (!src) return null
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className="object-cover"
    />
  )
}
