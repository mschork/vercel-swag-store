import Image from 'next/image'
import type { Product } from '@/lib/api/types'
import { cn } from '@/lib/utils'

/**
 * A product's first photo, filling its parent (which sets the frame and the
 * aspect). `alt` is empty where the surrounding link already names the
 * product (cards) and the product name where the image is the link's only
 * content. Renders nothing for a product without images.
 */
export function ProductImage({
  product,
  sizes,
  alt,
  preload = false,
  className,
}: {
  product: Product
  sizes: string
  alt: string
  preload?: boolean
  className?: string
}) {
  const src = product.images[0]
  if (!src) return null
  return (
    <Image
      src={src}
      alt={alt}
      fill
      preload={preload}
      sizes={sizes}
      className={cn('object-cover', className)}
    />
  )
}
