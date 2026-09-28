import Image from 'next/image'

/**
 * At md and up the photo fills one of two columns; from 1152px the container
 * stops growing, leaving a 528px column.
 */
const SIZES = '(min-width: 1152px) 528px, (min-width: 768px) 50vw, 100vw'

/**
 * The large product photo in its square frame on the secondary surface. Shared
 * by the one-image gallery (server) and the thumbnail gallery (client). The
 * preloaded photo is the page's LCP; `fetchPriority` is set with `preload`
 * because `preload` alone leaves the browser's default priority.
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
          fetchPriority={preload ? 'high' : undefined}
          sizes={SIZES}
          className="object-cover"
        />
      ) : null}
    </div>
  )
}
