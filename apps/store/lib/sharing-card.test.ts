import { describe, expect, it } from 'vitest'
import { HERO_FALLBACK } from '@/lib/content/fallbacks'
import { sharingCard } from './sharing-card'

const photo = (ref: string) => ({ asset: { _ref: ref, _type: 'reference' as const } })

describe('sharingCard', () => {
  it('is the editor’s sharing image when there is one, whatever the hero holds', () => {
    const card = sharingCard(
      { ogImage: photo('image-og') },
      { hero: { headline: 'Ship in black.', image: photo('image-hero') } },
    )
    expect(card).toEqual({ kind: 'upload', photo: photo('image-og') })
  })

  it('is the hero’s photo and headline without a sharing image', () => {
    const card = sharingCard(
      { ogImage: null },
      { hero: { headline: 'Ship in black.', image: photo('image-hero') } },
    )
    expect(card).toEqual({ kind: 'hero', photo: photo('image-hero'), headline: 'Ship in black.' })
  })

  it('falls back to the bundled photo and headline when Sanity has neither', () => {
    expect(sharingCard(null, null)).toEqual({
      kind: 'hero',
      photo: null,
      headline: HERO_FALLBACK.headline,
    })
  })

  it('ignores an image field that holds alt text and no asset', () => {
    const card = sharingCard({ ogImage: { alt: 'Only words' } as never }, null)
    expect(card.kind).toBe('hero')
  })
})
