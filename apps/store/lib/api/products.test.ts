import { cacheLife, cacheTag } from 'next/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCall, mockFetch, ok, pagination, product } from '@/test/helpers'
import { buildQuery, getAllProductSlugs, getProduct, getProducts } from './products'

let fetchMock: ReturnType<typeof mockFetch>

beforeEach(() => {
  fetchMock = mockFetch()
  vi.mocked(cacheTag).mockClear()
  vi.mocked(cacheLife).mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildQuery', () => {
  it('sorts keys, drops undefined and serialises booleans', () => {
    expect(buildQuery({ search: 'tee', featured: true, category: undefined, limit: 5 })).toBe(
      '?featured=true&limit=5&search=tee',
    )
  })

  it('returns an empty string for no params', () => {
    expect(buildQuery({})).toBe('')
  })

  it('encodes values', () => {
    expect(buildQuery({ search: 'black tee & more' })).toBe('?search=black+tee+%26+more')
  })
})

describe('getProducts', () => {
  it('returns products and pagination from the envelope', async () => {
    fetchMock.mockResolvedValueOnce(ok([product()], { pagination: pagination({ total: 1 }) }))
    const result = await getProducts({ featured: true, limit: 12 })
    expect(result.products).toHaveLength(1)
    expect(result.products[0]?.slug).toBe('black-crewneck-t-shirt')
    expect(result.pagination.total).toBe(1)
    expect(fetchCall(fetchMock)[0]).toMatch(/\/products\?featured=true&limit=12$/)
  })

  it('declares the products tag and the catalog lifetime', async () => {
    fetchMock.mockResolvedValueOnce(ok([], { pagination: pagination({ total: 0 }) }))
    await getProducts()
    expect(cacheTag).toHaveBeenCalledWith('products')
    expect(cacheLife).toHaveBeenCalledWith('catalog')
  })
})

describe('getProduct', () => {
  it('fetches by id or slug, URL-encoded', async () => {
    fetchMock.mockResolvedValueOnce(ok(product()))
    const result = await getProduct('black crewneck')
    expect(result.id).toBe('tshirt_001')
    expect(fetchCall(fetchMock)[0]).toMatch(/\/products\/black%20crewneck$/)
    expect(cacheTag).toHaveBeenCalledWith('products')
  })
})

describe('getAllProductSlugs', () => {
  it('pages with limit=100 until hasNextPage is false', async () => {
    fetchMock
      .mockResolvedValueOnce(
        ok([product({ slug: 'one' }), product({ slug: 'two' })], {
          pagination: pagination({ page: 1, limit: 100, total: 3, totalPages: 2, hasNextPage: true }),
        }),
      )
      .mockResolvedValueOnce(
        ok([product({ slug: 'three' })], {
          pagination: pagination({ page: 2, limit: 100, total: 3, totalPages: 2, hasPreviousPage: true }),
        }),
      )
    const slugs = await getAllProductSlugs()
    expect(slugs).toEqual(['one', 'two', 'three'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchCall(fetchMock, 0)[0]).toMatch(/\/products\?limit=100&page=1$/)
    expect(fetchCall(fetchMock, 1)[0]).toMatch(/\/products\?limit=100&page=2$/)
  })
})
