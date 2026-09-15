import { cacheLife, cacheTag } from 'next/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  apiError,
  fetchCall,
  mockFetch,
  ok,
  pagination,
  product,
} from '@/test/helpers'
import { ApiError } from './client'
import {
  buildQuery,
  findProduct,
  getAllProducts,
  getAllProductSlugs,
  getFeaturedProducts,
  getProduct,
  getProducts,
} from './products'

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
    expect(
      buildQuery({
        search: 'tee',
        featured: true,
        category: undefined,
        limit: 5,
      }),
    ).toBe('?featured=true&limit=5&search=tee')
  })

  it('returns an empty string for no params', () => {
    expect(buildQuery({})).toBe('')
  })

  it('encodes values', () => {
    expect(buildQuery({ search: 'black tee & more' })).toBe(
      '?search=black+tee+%26+more',
    )
  })
})

describe('getProducts', () => {
  it('returns products and pagination from the envelope', async () => {
    fetchMock.mockResolvedValueOnce(
      ok([product()], { pagination: pagination({ total: 1 }) }),
    )
    const result = await getProducts({ featured: true, limit: 12 })
    expect(result.products).toHaveLength(1)
    expect(result.products[0]?.slug).toBe('black-crewneck-t-shirt')
    expect(result.pagination.total).toBe(1)
    expect(fetchCall(fetchMock)[0]).toMatch(
      /\/products\?featured=true&limit=12$/,
    )
  })

  it('declares the products tag and the catalog lifetime', async () => {
    fetchMock.mockResolvedValueOnce(
      ok([], { pagination: pagination({ total: 0 }) }),
    )
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

describe('getProduct', () => {
  it('throws ApiError 404 for an unknown product', async () => {
    fetchMock.mockResolvedValueOnce(
      apiError(404, 'NOT_FOUND', "Product with id 'nope' not found"),
    )
    await expect(getProduct('nope')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      code: 'NOT_FOUND',
    })
  })
})

describe('findProduct', () => {
  it('returns the product, cached as catalogue data', async () => {
    fetchMock.mockResolvedValueOnce(ok(product()))
    await expect(findProduct('black-crewneck-t-shirt')).resolves.toMatchObject({
      id: 'tshirt_001',
    })
    expect(cacheTag).toHaveBeenCalledWith('products')
    expect(cacheLife).toHaveBeenCalledWith('catalog')
  })

  it('returns null for an unknown product', async () => {
    fetchMock.mockResolvedValueOnce(
      apiError(404, 'NOT_FOUND', "Product with id 'nope' not found"),
    )
    await expect(findProduct('nope')).resolves.toBeNull()
  })

  it('rethrows any other API error', async () => {
    fetchMock.mockResolvedValueOnce(apiError(400, 'VALIDATION_ERROR', 'Bad id'))
    await expect(findProduct('bad')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('getAllProducts', () => {
  it('pages with limit=100 until hasNextPage is false', async () => {
    fetchMock
      .mockResolvedValueOnce(
        ok([product({ slug: 'one' }), product({ slug: 'two' })], {
          pagination: pagination({
            page: 1,
            limit: 100,
            total: 3,
            totalPages: 2,
            hasNextPage: true,
          }),
        }),
      )
      .mockResolvedValueOnce(
        ok([product({ slug: 'three' })], {
          pagination: pagination({
            page: 2,
            limit: 100,
            total: 3,
            totalPages: 2,
            hasPreviousPage: true,
          }),
        }),
      )
    const products = await getAllProducts()
    expect(products.map((p) => p.slug)).toEqual(['one', 'two', 'three'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchCall(fetchMock, 0)[0]).toMatch(/\/products\?limit=100&page=1$/)
    expect(fetchCall(fetchMock, 1)[0]).toMatch(/\/products\?limit=100&page=2$/)
  })
})

describe('getAllProductSlugs', () => {
  it('lists the slugs of the whole catalogue', async () => {
    fetchMock.mockResolvedValueOnce(
      ok([product({ slug: 'one' }), product({ slug: 'two' })], {
        pagination: pagination({ total: 2 }),
      }),
    )
    await expect(getAllProductSlugs()).resolves.toEqual(['one', 'two'])
    expect(cacheTag).toHaveBeenCalledWith('products')
    expect(cacheLife).toHaveBeenCalledWith('catalog')
  })
})

describe('getFeaturedProducts', () => {
  const featured = (id: string) => product({ id, slug: id, featured: true })
  const plain = (id: string) => product({ id, slug: id, featured: false })

  it('returns the featured products alone when they meet the minimum', async () => {
    fetchMock.mockResolvedValueOnce(
      ok([featured('a'), featured('b')], {
        pagination: pagination({ total: 2 }),
      }),
    )
    const result = await getFeaturedProducts({ limit: 12, min: 2 })
    expect(result.map((p) => p.id)).toEqual(['a', 'b'])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchCall(fetchMock)[0]).toMatch(
      /\/products\?featured=true&limit=12$/,
    )
  })

  it('tops up from the catalogue, featured first, skipping duplicates, until the minimum', async () => {
    fetchMock
      .mockResolvedValueOnce(
        ok([featured('a')], { pagination: pagination({ total: 1 }) }),
      )
      .mockResolvedValueOnce(
        ok([featured('a'), plain('b'), plain('c'), plain('d')], {
          pagination: pagination({ total: 4 }),
        }),
      )
    const result = await getFeaturedProducts({ limit: 12, min: 3 })
    expect(result.map((p) => p.id)).toEqual(['a', 'b', 'c'])
    expect(fetchCall(fetchMock, 1)[0]).toMatch(/\/products\?limit=12$/)
  })

  it('returns what exists when the whole catalogue is smaller than the minimum', async () => {
    fetchMock
      .mockResolvedValueOnce(ok([], { pagination: pagination({ total: 0 }) }))
      .mockResolvedValueOnce(
        ok([plain('b')], { pagination: pagination({ total: 1 }) }),
      )
    const result = await getFeaturedProducts({ limit: 12, min: 6 })
    expect(result.map((p) => p.id)).toEqual(['b'])
  })

  it('declares the products tag and the catalog lifetime', async () => {
    fetchMock.mockResolvedValueOnce(
      ok([featured('a')], { pagination: pagination({ total: 1 }) }),
    )
    await getFeaturedProducts({ limit: 1, min: 1 })
    expect(cacheTag).toHaveBeenCalledWith('products')
    expect(cacheLife).toHaveBeenCalledWith('catalog')
  })
})
