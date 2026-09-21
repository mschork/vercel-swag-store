import type { SanityImageSource } from '@sanity/image-url'
import { HERO_FALLBACK } from '@/lib/content/fallbacks'
import { hasImage, type SanityPhoto } from '@/lib/sanity/image'

type Photo = (SanityImageSource & SanityPhoto) | null | undefined

/**
 * What the store's sharing card shows. An editor's sharing image is the whole
 * card; without one the card is the home page's hero, and `photo` is `null`
 * when the hero has no uploaded photo, so the caller draws the bundled one.
 */
export type SharingCard =
  | { kind: 'upload'; photo: SanityImageSource }
  | { kind: 'hero'; photo: SanityImageSource | null; headline: string }

export function sharingCard(
  settings: { ogImage?: Photo } | null | undefined,
  home: { hero?: { headline?: string | null; image?: Photo } | null } | null | undefined,
): SharingCard {
  if (hasImage(settings?.ogImage)) return { kind: 'upload', photo: settings.ogImage }
  const hero = home?.hero
  return {
    kind: 'hero',
    photo: hasImage(hero?.image) ? hero.image : null,
    headline: hero?.headline || HERO_FALLBACK.headline,
  }
}
