import { describe, expect, it } from 'vitest'
import { LISTING_FALLBACK, listingIntro } from './fallbacks'

describe('listingIntro', () => {
  it('is the editor’s line when there is one', () => {
    expect(listingIntro(null, 'All of it.')).toBe('All of it.')
    expect(listingIntro({ name: 'Bags' }, 'Carry things.')).toBe('Carry things.')
  })

  it('falls back per listing when the editor wrote none', () => {
    expect(listingIntro(null, '')).toBe(LISTING_FALLBACK.intro)
    expect(listingIntro({ name: 'Bags' }, null)).toBe('Browse all Bags in the store.')
  })
})
