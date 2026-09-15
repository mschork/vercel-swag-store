import Image from 'next/image'

/**
 * Two columns at md and up inside the 1152px container: about half the
 * viewport, capped at the column width on wide screens.
 */
const SIZES = '(min-width: 1152px) 552px, (min-width: 768px) 50vw, 100vw'

/**
 * The large product photo in its square frame on the secondary surface. Shared
 * by the one-image gallery (server) and the thumbnail gallery (client).
 * `preload` is Next 16's name for the deprecated `priority`.
 */
export function GalleryImage({
  src,
  alt,
  preload,
}: {
  src: string | undefined
  alt: string
  preload: boolean
}) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-bg-secondary">
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          preload={preload}
          sizes={SIZES}
          className="object-cover"
        />
      ) : null}
    </div>
  )
}
