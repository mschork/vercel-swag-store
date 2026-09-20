'use client'

import Image from 'next/image'
import { useState } from 'react'
import { GalleryImage } from './gallery-image'

/**
 * The gallery for a product with more than one image. The selected image is
 * local state; the first one is the preloaded LCP candidate.
 */
export function GalleryThumbnails({
  images,
  name,
}: {
  images: readonly string[]
  name: string
}) {
  const [selected, setSelected] = useState(0)
  return (
    <div className="flex flex-col gap-3">
      <GalleryImage
        src={images[selected]}
        alt={name}
        preload={selected === 0}
      />
      <ul className="grid grid-cols-5 gap-3" aria-label={`${name}, images`}>
        {images.map((src, index) => (
          <li key={index}>
            <button
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-pressed={index === selected}
              className={`relative block aspect-square w-full overflow-hidden rounded-lg border bg-bg-secondary ${
                index === selected
                  ? 'border-fg'
                  : 'border-border hover:border-border-strong'
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="(min-width: 768px) 10vw, 20vw"
                className="object-cover"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
