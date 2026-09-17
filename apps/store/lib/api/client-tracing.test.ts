import { trace } from '@opentelemetry/api'
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { apiError, jsonResponse, mockFetch } from '@/test/helpers'
import { fetchApi, routeOf } from './client'

const exporter = new InMemorySpanExporter()

beforeAll(() => {
  trace.setGlobalTracerProvider(
    new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter)] }),
  )
})

afterAll(() => {
  trace.disable()
})

beforeEach(() => {
  exporter.reset()
})

const Thing = z.object({ id: z.string() })

describe('fetchApi tracing', () => {
  it('records one span per call with the method, path, cache policy and status', async () => {
    mockFetch().mockResolvedValueOnce(jsonResponse(200, { success: true, data: { id: 'a' } }))
    await fetchApi('/products/tumbler_001/stock', { cache: 'live', schema: Thing })
    const [span, ...rest] = exporter.getFinishedSpans()
    expect(rest).toEqual([])
    expect(span?.name).toBe('swag-api GET /products/:id/stock')
    expect(span?.attributes).toEqual({
      'http.request.method': 'GET',
      'swag.api.path': '/products/tumbler_001/stock',
      'swag.api.cache': 'live',
      'http.response.status_code': 200,
    })
  })

  it('marks a failed call as an error with the API code', async () => {
    mockFetch().mockResolvedValueOnce(apiError(404, 'NOT_FOUND', 'Product not found'))
    await expect(
      fetchApi('/products/nope', { cache: 'cached', schema: Thing }),
    ).rejects.toThrow('Product not found')
    const [span] = exporter.getFinishedSpans()
    expect(span?.status.code).toBe(2)
    expect(span?.attributes).toMatchObject({
      'swag.api.cache': 'cached',
      'swag.api.error': 'NOT_FOUND',
      'http.response.status_code': 404,
    })
  })

  it('never puts request headers, and so never a token, on the span', async () => {
    mockFetch().mockResolvedValueOnce(jsonResponse(200, { success: true, data: { id: 'a' } }))
    await fetchApi('/cart', {
      cache: 'live',
      schema: Thing,
      headers: { 'x-cart-token': 'secret-cart-token' },
    })
    const serialised = JSON.stringify(exporter.getFinishedSpans().map((s) => s.attributes))
    expect(serialised).not.toContain('secret-cart-token')
    expect(serialised).not.toContain(process.env.API_BYPASS_TOKEN)
  })
})

describe('routeOf', () => {
  it.each([
    ['/products?limit=12&page=2', '/products'],
    ['/products/tumbler_001', '/products/:idOrSlug'],
    ['/products/tumbler_001/stock', '/products/:id/stock'],
    ['/categories', '/categories'],
    ['/store/config', '/store/config'],
    ['/cart', '/cart'],
    ['/cart/create', '/cart/create'],
    ['/cart/tumbler_001', '/cart/:productId'],
    ['/health', '/health'],
  ])('%s is %s', (path, route) => {
    expect(routeOf(path)).toBe(route)
  })
})
