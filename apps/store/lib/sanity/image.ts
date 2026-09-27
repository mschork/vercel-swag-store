import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'
import { publicEnv } from '@/lib/env.public'

/**
 * Sanity images for `next/image`. The builder applies the editor's hotspot and
 * crop, so a full-bleed photo keeps its subject at every breakpoint, and asks
 * Sanity for the format the browser prefers.
 *
 * `lqip` is the tiny blurred copy Sanity stores with every asset; passing it as
 * the placeholder means no grey box while the photo loads.
 */
const builder = createImageUrlBuilder({
  projectId: publicEnv.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: publicEnv.NEXT_PUBLIC_SANITY_DATASET,
})

export interface SanityPhoto {
  alt?: string | null
  lqip?: string | null
  aspectRatio?: number | null
}

/** The widest a Sanity photo is ever rendered here; `sizes` picks from it. */
const MAX_WIDTH = 1920

export function sanityImageProps(
  image: SanityImageSource & SanityPhoto,
  { width = MAX_WIDTH }: { width?: number } = {},
) {
  return {
    src: builder.image(image).width(width).fit('max').auto('format').url(),
    alt: image.alt ?? '',
    placeholder: image.lqip ? ('blur' as const) : undefined,
    blurDataURL: image.lqip ?? undefined,
  }
}

/**
 * A Sanity photo cropped to exactly this size around the editor's hotspot, as
 * a JPEG: the `next/og` renderer sends no `Accept` header and reads no WebP.
 */
export function sanityCoverUrl(
  image: SanityImageSource,
  { width, height }: { width: number; height: number },
) {
  return builder.image(image).width(width).height(height).fit('crop').format('jpg').url()
}

/** True when the query returned an image an editor uploaded. */
export function hasImage(
  image: (SanityImageSource & SanityPhoto) | null | undefined,
): image is SanityImageSource & SanityPhoto {
  return Boolean(image && typeof image === 'object' && 'asset' in image && image.asset)
}

/** A gallery photo as the gallery components render it. */
export interface GalleryPhoto {
  src: string
  alt: string
}

/**
 * A merged gallery for the gallery components: the API's photos pass through
 * with the product's name as their alt, as the API sends no text; Sanity's
 * are asked for at a sensible width and keep the editor's alt, which in draft
 * mode is what the click-to-edit overlay reads.
 */
export function galleryPhotos(
  gallery: readonly (string | (SanityImageSource & SanityPhoto))[],
  name: string,
  width = 1024,
): GalleryPhoto[] {
  return gallery.map((photo) => {
    if (typeof photo === 'string') return { src: photo, alt: name }
    const { src, alt } = sanityImageProps(photo, { width })
    return { src, alt: alt || name }
  })
}
