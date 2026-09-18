import { GalleryImage } from './gallery-image'
import { GalleryThumbnails } from './gallery-thumbnails'

/**
 * The product photos: the API's, followed by any an editor added (E09). With
 * one image this stays a server component; thumbnails and their client-side
 * selection render only when there is more than one.
 */
export function ProductGallery({
  images,
  name,
}: {
  images: readonly string[]
  name: string
}) {
  if (images.length > 1) {
    return <GalleryThumbnails images={images} name={name} />
  }
  return <GalleryImage src={images[0]} alt={name} preload />
}
