import { describe, expect, it } from 'vitest'
import { product } from '@/test/helpers'
import { favouriteProducts } from './favourites'

const tee = product({ id: 'tshirt_001' })
const mug = product({ id: 'mug_001', name: 'Black Mug', slug: 'black-mug' })
const tote = product({ id: 'tote_001', name: 'Black Tote', slug: 'black-tote' })
const catalogue = [tee, mug, tote] as never[]

describe('favouriteProducts', () => {
  it('keeps the order Sanity ranked them in', () => {
    const ranked = favouriteProducts(
      [{ apiId: 'tote_001' }, { apiId: 'tshirt_001' }, { apiId: 'mug_001' }],
      catalogue,
    )
    expect(ranked.map((p) => p.id)).toEqual(['tote_001', 'tshirt_001', 'mug_001'])
  })

  it('drops a favourite the API no longer returns', () => {
    const ranked = favouriteProducts([{ apiId: 'mug_001' }, { apiId: 'gone_001' }], catalogue)
    expect(ranked.map((p) => p.id)).toEqual(['mug_001'])
  })

  it('ignores a row with no id and never repeats a product', () => {
    const ranked = favouriteProducts(
      [{ apiId: null }, { apiId: 'mug_001' }, { apiId: 'mug_001' }],
      catalogue,
    )
    expect(ranked.map((p) => p.id)).toEqual(['mug_001'])
  })

  it('returns nothing when the lookbook names nothing', () => {
    expect(favouriteProducts([], catalogue)).toEqual([])
  })
})
