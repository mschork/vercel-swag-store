import { describe, expect, it } from 'vitest'
import { galleryPhotos } from './image'

const asset = { _type: 'reference', _ref: 'image-abc123-800x800-jpg' } as const

describe('galleryPhotos', () => {
  it("gives an API photo the product's name as its alt", () => {
    expect(galleryPhotos(['https://api.test/p.jpg'], 'Tote')).toEqual([
      { src: 'https://api.test/p.jpg', alt: 'Tote' },
    ])
  })

  it("keeps the editor's alt on a Sanity photo", () => {
    expect(galleryPhotos([{ asset, alt: 'The tote on a chair' }], 'Tote')).toEqual([
      { src: expect.stringContaining('abc123-800x800.jpg'), alt: 'The tote on a chair' },
    ])
  })

  it("falls back to the product's name when a Sanity photo has no alt", () => {
    expect(galleryPhotos([{ asset, alt: '' }], 'Tote')).toEqual([
      { src: expect.any(String), alt: 'Tote' },
    ])
  })
})
