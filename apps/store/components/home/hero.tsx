import Image from 'next/image'
import { Container } from '@/components/container'
import { HERO_FALLBACK } from '@/lib/content/fallbacks'
import { getHomePage } from '@/lib/sanity/content'
import { cn } from '@/lib/utils'
import { hasImage, sanityImageProps } from '@/lib/sanity/image'

/**
 * Full-bleed hero: the photo edge to edge, with the copy over it from lg and
 * below it at narrower widths. The photo is the LCP element and the only
 * preloaded image on the page; `fetchPriority` is set because `preload` alone
 * leaves the browser's default. Copy and photo come from the `homePage`
 * document; the store ships copy but no photo, so without one the section is
 * the copy alone. Both reads are cached, so the shell stays prerendered.
 */
export async function Hero() {
  const content = await getHomePage()
  const headline = content?.hero?.headline || HERO_FALLBACK.headline
  const description = content?.hero?.description || HERO_FALLBACK.description
  const photo = hasImage(content?.hero?.image)
    ? sanityImageProps(content.hero.image, { width: 1920 })
    : null
  return (
    <section aria-labelledby="hero-heading" className="relative">
      {photo ? (
        <div className="relative aspect-4/3 w-full md:aspect-2/1 lg:aspect-auto lg:h-[min(60svh,640px)]">
          <Image
            {...photo}
            alt={photo.alt}
            fill
            preload
            fetchPriority="high"
            sizes="100vw"
            className="object-cover object-[20%_15%] lg:object-[30%_20%]"
          />
        </div>
      ) : null}
      <Container
        className={cn(
          'flex flex-col gap-4 py-8',
          photo && 'lg:absolute lg:inset-0 lg:justify-start lg:pt-[6%]',
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-4',
            photo && 'lg:ml-auto lg:w-[42%] lg:max-w-md lg:text-on-photo',
          )}
        >
          <h1
            id="hero-heading"
            className="text-3xl font-medium tracking-tight text-balance md:text-[4.2rem] md:leading-none"
          >
            {headline}
          </h1>
          <p
            className={cn(
              'max-w-prose text-base text-fg-secondary md:text-lg',
              photo && 'lg:text-on-photo/80',
            )}
          >
            {description}
          </p>
        </div>
      </Container>
    </section>
  )
}
