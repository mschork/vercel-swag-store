import { describe, expect, it } from 'vitest'
import { product } from '@/test/helpers'
import { mergeProduct } from './merge'

const blocks = [{ _type: 'block', _key: 'a', children: [] }] as never

const document = {
  extendedDescription: blocks,
  care: blocks,
  gallery: [
    { _key: 'g1', asset: { _ref: 'image-extra', _type: 'reference' }, lqip: null, aspectRatio: 1, alt: 'Extra' },
  ],
  categoryFaqs: [],
  attachedFaqs: null,
}

describe('mergeProduct', () => {
  it('returns the API product untouched when there is no document', () => {
    const api = product()
    const merged = mergeProduct(api, null)
    expect(merged).toMatchObject({
      id: api.id,
      name: api.name,
      price: api.price,
      category: api.category,
    })
    expect(merged.extendedDescription).toBeNull()
    expect(merged.gallery).toEqual(api.images)
  })

  it('never lets the document change what the API owns', () => {
    const api = product({ name: 'Black Beanie', price: 2500, category: 'hats' })
    const merged = mergeProduct(api, {
      ...document,
      // A document that tries to restate commerce facts; the merge ignores it.
      name: 'Something else',
      price: 1,
      category: 'hoodies',
    } as never)
    expect(merged.name).toBe('Black Beanie')
    expect(merged.price).toBe(2500)
    expect(merged.category).toBe('hats')
  })

  it('copies the editorial fields when they have content', () => {
    const merged = mergeProduct(product(), document as never)
    expect(merged.extendedDescription).toBe(blocks)
    expect(merged.care).toBe(blocks)
  })

  it('treats empty rich text as no content', () => {
    const merged = mergeProduct(product(), {
      ...document,
      extendedDescription: [],
      care: null,
    } as never)
    expect(merged.extendedDescription).toBeNull()
    expect(merged.care).toBeNull()
  })

  it('puts the API photos first and the editor\u2019s after', () => {
    const api = product({ images: ['https://blob/one.png'] })
    const merged = mergeProduct(api, document as never)
    expect(merged.gallery).toHaveLength(2)
    expect(merged.gallery[0]).toBe('https://blob/one.png')
    expect(merged.gallery[1]).toMatchObject({ alt: 'Extra' })
  })
})
