import Image from 'next/image'
import { Container } from '@/components/container'
import { HERO_FALLBACK, HERO_IMAGE } from '@/lib/content/fallbacks'

/**
 * Full-bleed hero (E10): the photo edge to edge, the copy over the open sky
 * on its right from lg up and under it below that, where the band is the
 * photo's own 2:1 at md and a 4:3 crop around the figure on phones. At md the
 * figure and the copy would share the width, so the copy stays below. The photo is the LCP element and the
 * only preloaded image on the page, fetched at high priority because `preload`
 * alone leaves the browser's default. No link, no button. E09 reads the same
 * fields from Sanity.
 */
export function Hero() {
  const { headline, description } = HERO_FALLBACK
  return (
    <section aria-labelledby="hero-heading" className="relative">
      <div className="relative aspect-[4/3] w-full md:aspect-[2/1] lg:aspect-auto lg:h-[min(60svh,640px)]">
        <Image
          src={HERO_IMAGE.src}
          alt={HERO_IMAGE.alt}
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-[20%_15%] lg:object-[30%_20%]"
        />
      </div>
      <Container className="flex flex-col gap-4 py-8 lg:absolute lg:inset-0 lg:justify-start lg:pt-[6%]">
        <div className="flex flex-col gap-4 lg:ml-auto lg:w-[42%] lg:max-w-md lg:text-on-photo">
          <h1
            id="hero-heading"
            className="text-3xl font-medium tracking-tight text-balance md:text-[4.2rem] md:leading-none"
          >
            {headline}
          </h1>
          <p className="max-w-prose text-base text-fg-secondary md:text-lg lg:text-on-photo/80">
            {description}
          </p>
        </div>
      </Container>
    </section>
  )
}
