import type { GalleryPhoto } from '@/lib/sanity/image'
import { GalleryImage } from './gallery-image'
import { GalleryThumbnails } from './gallery-thumbnails'

/**
 * The product photos: the API's, followed by any an editor added. With
 * one image this stays a server component; thumbnails and their client-side
 * selection render only when there is more than one.
 */
export function ProductGallery({
  photos,
  name,
}: {
  photos: readonly GalleryPhoto[]
  name: string
}) {
  if (photos.length > 1) {
    return <GalleryThumbnails photos={photos} name={name} />
  }
  return <GalleryImage src={photos[0]?.src} alt={photos[0]?.alt ?? name} preload />
}
