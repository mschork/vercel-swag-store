import { describe, expect, it } from 'vitest'
import { product } from '@/test/helpers'
import type { Category } from './api/types'
import { expandQuery, mergeResults, normaliseQuery } from './search'

/** The live category list, so the expansion is tested against real names. */
const categories: Category[] = [
  { slug: 'bottles', name: 'Bottles', productCount: 1 },
  { slug: 'cups', name: 'Cups', productCount: 2 },
  { slug: 'mugs', name: 'Mugs', productCount: 2 },
  { slug: 'desk', name: 'Desk', productCount: 2 },
  { slug: 'stationery', name: 'Stationery', productCount: 5 },
  { slug: 'accessories', name: 'Accessories', productCount: 4 },
  { slug: 'bags', name: 'Bags', productCount: 3 },
  { slug: 'hats', name: 'Hats', productCount: 3 },
  { slug: 't-shirts', name: 'T Shirts', productCount: 1 },
  { slug: 'hoodies', name: 'Hoodies', productCount: 1 },
  { slug: 'socks', name: 'Socks', productCount: 1 },
  { slug: 'tech', name: 'Tech', productCount: 2 },
  { slug: 'books', name: 'Books', productCount: 1 },
]

describe('normaliseQuery', () => {
  it('trims surrounding whitespace', () => {
    expect(normaliseQuery('  hat  ')).toBe('hat')
  })

  it('treats whitespace-only input as no query', () => {
    expect(normaliseQuery('   \t\n ')).toBe('')
  })

  it('treats a missing value as no query', () => {
    expect(normaliseQuery(undefined)).toBe('')
    expect(normaliseQuery(null)).toBe('')
  })

  it('cuts anything past 64 characters', () => {
    const long = 'a'.repeat(300)
    expect(normaliseQuery(long)).toHaveLength(64)
  })

  it('trims before slicing, so padding never eats the query', () => {
    expect(normaliseQuery(`   ${'b'.repeat(64)}   `)).toBe('b'.repeat(64))
  })
})

describe('expandQuery', () => {
  it.each([
    ['hat', 'hats'],
    ['Hats', 'hats'],
    ['bag', 'bags'],
    ['cups', 'cups'],
    ['shirt', 't-shirts'],
    ['t-shirt', 't-shirts'],
    // The API matches punctuation literally, so these three reach the product
    // only through the category.
    ['tshirt', 't-shirts'],
    ['t shirt', 't-shirts'],
    ['tshirts', 't-shirts'],
    ['mug', 'mugs'],
    ['  BOOKS  ', 'books'],
  ])('matches %s to the %s category', (query, slug) => {
    expect(expandQuery(query, categories)?.slug).toBe(slug)
  })

  it.each([['tee'], ['black'], ['umbrella'], ['']])(
    'leaves %s unexpanded',
    (query) => {
      expect(expandQuery(query, categories)).toBeNull()
    },
  )

  it('does not match a substring that is not a whole word', () => {
    // "at" sits inside "Hats" but is not a word there.
    expect(expandQuery('at', categories)).toBeNull()
  })

  it('squashing separators does not let a fragment through', () => {
    // "shirt" reaches t-shirts as a whole word; "hirt" is neither that nor an
    // equal after squashing.
    expect(expandQuery('hirt', categories)).toBeNull()
    expect(expandQuery('tshir', categories)).toBeNull()
  })

  it('never matches when there are no categories', () => {
    expect(expandQuery('hat', [])).toBeNull()
  })

  it('treats a query with regex characters as text', () => {
    expect(expandQuery('ha.s', categories)).toBeNull()
  })
})

/** A product in the matched category, and one that only mentions it in prose. */
const inCat = (id: string) => product({ id, slug: id, category: 'bags' })
const elsewhere = (id: string) =>
  product({ id, slug: id, category: 'accessories' })

describe('mergeResults', () => {
  const ids = (merged: { products: { id: string }[] }) =>
    merged.products.map((p) => p.id)

  it('puts the matched category ahead of hits that only mention it', () => {
    // The live shape of a "bag" search: the pin and the keychain match on
    // prose, the tote and the drawstring bag are the category.
    const merged = mergeResults(
      [elsewhere('pin'), elsewhere('keychain'), inCat('tote'), inCat('drawstring')],
      [inCat('tote'), inCat('drawstring'), inCat('backpack')],
      'bags',
    )
    expect(ids(merged)).toEqual([
      'tote',
      'drawstring',
      'backpack',
      'pin',
      'keychain',
    ])
    expect(merged.added).toBe(true)
    expect(merged.truncated).toBe(false)
  })

  it('appends the category behind an in-category hit', () => {
    const merged = mergeResults([inCat('a')], [inCat('b'), inCat('c')], 'bags')
    expect(ids(merged)).toEqual(['a', 'b', 'c'])
    expect(merged.added).toBe(true)
    expect(merged.truncated).toBe(false)
  })

  it('de-duplicates by id, keeping the search hit\'s position', () => {
    const merged = mergeResults([inCat('a'), inCat('b')], [inCat('b'), inCat('c')], 'bags')
    expect(ids(merged)).toEqual(['a', 'b', 'c'])
  })

  it('reports no addition when the category contributes nothing new', () => {
    const merged = mergeResults([inCat('a'), inCat('b')], [inCat('b')], 'bags')
    expect(ids(merged)).toEqual(['a', 'b'])
    expect(merged.added).toBe(false)
    expect(merged.truncated).toBe(false)
  })

  it('caps at five and reports the truncation', () => {
    const merged = mergeResults(
      [inCat('a'), inCat('b')],
      [inCat('c'), inCat('d'), inCat('e'), inCat('f')],
      'bags',
    )
    expect(ids(merged)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(merged.added).toBe(true)
    expect(merged.truncated).toBe(true)
  })

  it('lets a category product take a slot from a hit that only mentions it', () => {
    // The stated cost of ranking by category: "keychain" is a real hit and
    // still loses its place to a product that is in the category.
    const merged = mergeResults(
      [inCat('tote'), elsewhere('pin'), elsewhere('keychain')],
      [inCat('tote'), inCat('drawstring'), inCat('backpack')],
      'bags',
      4,
    )
    expect(ids(merged)).toEqual(['tote', 'drawstring', 'backpack', 'pin'])
    expect(merged.truncated).toBe(true)
  })

  it('reports no addition when the cap cuts every category item', () => {
    const search = ['a', 'b', 'c', 'd', 'e'].map(inCat)
    const merged = mergeResults(search, [inCat('f')], 'bags')
    expect(merged.products).toHaveLength(5)
    expect(merged.added).toBe(false)
    expect(merged.truncated).toBe(true)
  })

  it('honours a custom cap', () => {
    const merged = mergeResults([inCat('a')], [inCat('b'), inCat('c')], 'bags', 2)
    expect(ids(merged)).toEqual(['a', 'b'])
    expect(merged.truncated).toBe(true)
  })

  it('handles an empty search result', () => {
    const merged = mergeResults([], [inCat('a'), inCat('b')], 'bags')
    expect(ids(merged)).toEqual(['a', 'b'])
    expect(merged.added).toBe(true)
  })
})
