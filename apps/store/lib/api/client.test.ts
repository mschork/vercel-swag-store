import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { fetchCall, jsonResponse as json, mockFetch } from '@/test/helpers'
import { ApiError, fetchApi } from './client'

const TOKEN = process.env.API_BYPASS_TOKEN as string
const BASE = process.env.API_BASE_URL as string

function html(status: number, statusText = 'Unauthorized') {
  return new Response('<html>Authentication Required</html>', {
    status,
    statusText,
    headers: { 'content-type': 'text/html' },
  })
}

const Thing = z.object({ id: z.string() })
let fetchMock: ReturnType<typeof mockFetch>

beforeEach(() => {
  fetchMock = mockFetch()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const call = (index = 0) => fetchCall(fetchMock, index)

async function capture(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof ApiError) return error
    throw error
  }
  throw new Error('expected fetchApi to throw')
}

describe('fetchApi', () => {
  it('unwraps the envelope and returns data, meta and headers', async () => {
    fetchMock.mockResolvedValueOnce(
      json(200, { success: true, data: { id: 'a' }, meta: { page: 2 } }, { 'x-thing': 'yes' }),
    )
    const result = await fetchApi('/things', {
      schema: Thing,
      metaSchema: z.object({ page: z.number() }),
    })
    expect(result.data).toEqual({ id: 'a' })
    expect(result.meta).toEqual({ page: 2 })
    expect(result.headers.get('x-thing')).toBe('yes')
  })

  it('ignores meta when no meta schema is given', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { success: true, data: { id: 'a' }, meta: { extra: 1 } }))
    const result = await fetchApi('/things', { schema: Thing })
    expect(result.data).toEqual({ id: 'a' })
  })

  it('builds the URL from API_BASE_URL and sends the bypass and accept headers', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { success: true, data: { id: 'a' } }))
    await fetchApi('/things?limit=1', { schema: Thing })
    const [url, init] = call()
    expect(url).toBe(`${BASE}/things?limit=1`)
    const headers = init.headers as Record<string, string>
    expect(headers['x-vercel-protection-bypass']).toBe(TOKEN)
    expect(headers.accept).toBe('application/json')
    expect(headers['content-type']).toBeUndefined()
    expect(init.method).toBe('GET')
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it('merges caller headers and serialises a JSON body', async () => {
    fetchMock.mockResolvedValueOnce(json(201, { success: true, data: { id: 'a' } }))
    await fetchApi('/cart', {
      schema: Thing,
      method: 'POST',
      body: { productId: 'p1', quantity: 2 },
      headers: { 'x-cart-token': 'cart-123' },
    })
    const [, init] = call()
    const headers = init.headers as Record<string, string>
    expect(headers['x-cart-token']).toBe('cart-123')
    expect(headers['content-type']).toBe('application/json')
    expect(init.body).toBe('{"productId":"p1","quantity":2}')
  })

  it.each([
    [400, 'BAD_REQUEST', 'Missing x-cart-token header'],
    [404, 'NOT_FOUND', "Product with id 'xyz' not found"],
    [422, 'VALIDATION_ERROR', 'Invalid request body'],
  ])('maps a %i error envelope to ApiError with the API code', async (status, code, message) => {
    fetchMock.mockResolvedValueOnce(
      json(status, { success: false, error: { code, message, details: { quantity: ['min 1'] } } }),
    )
    const error = await capture(fetchApi('/things', { schema: Thing }))
    expect(error.status).toBe(status)
    expect(error.code).toBe(code)
    expect(error.message).toBe(message)
    expect(error.path).toBe('/things')
    expect(error.details).toEqual({ quantity: ['min 1'] })
  })

  it('treats success:false on a 2xx as an API error', async () => {
    fetchMock.mockResolvedValueOnce(
      json(200, { success: false, error: { code: 'WEIRD', message: 'Nope' } }),
    )
    const error = await capture(fetchApi('/things', { schema: Thing }))
    expect(error.code).toBe('WEIRD')
    expect(error.status).toBe(200)
  })

  it('maps a 500 error envelope after one retry for GET', async () => {
    fetchMock.mockResolvedValue(
      json(500, { success: false, error: { code: 'INTERNAL', message: 'boom' } }),
    )
    const error = await capture(fetchApi('/things', { schema: Thing }))
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(error.status).toBe(500)
    expect(error.code).toBe('INTERNAL')
  })

  it('recovers when the retry succeeds', async () => {
    fetchMock
      .mockResolvedValueOnce(html(502, 'Bad Gateway'))
      .mockResolvedValueOnce(json(200, { success: true, data: { id: 'a' } }))
    const result = await fetchApi('/things', { schema: Thing })
    expect(result.data).toEqual({ id: 'a' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('never retries a mutation', async () => {
    fetchMock.mockResolvedValue(html(503, 'Service Unavailable'))
    const error = await capture(fetchApi('/cart', { schema: Thing, method: 'POST', body: {} }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(error.code).toBe('HTTP_ERROR')
    expect(error.status).toBe(503)
  })

  it('maps a non-JSON 401 (Vercel protection page) to HTTP_ERROR without the body', async () => {
    fetchMock.mockResolvedValueOnce(html(401))
    const error = await capture(fetchApi('/products', { schema: Thing }))
    expect(error.code).toBe('HTTP_ERROR')
    expect(error.status).toBe(401)
    expect(error.message).toBe('Unauthorized')
    expect(error.message).not.toContain('<html>')
  })

  it('retries a network error once for GET, then throws NETWORK_ERROR', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    const error = await capture(fetchApi('/things', { schema: Thing }))
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.status).toBe(0)
  })

  it('does not retry a timeout', async () => {
    const timeout = new Error('The operation was aborted due to timeout')
    timeout.name = 'TimeoutError'
    fetchMock.mockRejectedValue(timeout)
    const error = await capture(fetchApi('/things', { schema: Thing }))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(error.code).toBe('TIMEOUT')
  })

  it('throws INVALID_RESPONSE on a schema mismatch and logs only the path and issues', async () => {
    fetchMock.mockResolvedValueOnce(
      json(200, { success: true, data: { id: 42, token: 'cart-secret-token' } }),
    )
    const error = await capture(fetchApi('/cart', { schema: Thing }))
    expect(error.code).toBe('INVALID_RESPONSE')
    expect(error.message).not.toContain('cart-secret-token')
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls)
    expect(logged).toContain('/cart')
    expect(logged).not.toContain('cart-secret-token')
  })

  it('throws INVALID_RESPONSE when a 2xx body is not JSON', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } }),
    )
    const error = await capture(fetchApi('/health', { schema: Thing }))
    expect(error.code).toBe('INVALID_RESPONSE')
  })

  it('never puts the bypass token in an error message or path', async () => {
    const responses = [
      () => html(401),
      () => json(404, { success: false, error: { code: 'NOT_FOUND', message: 'gone' } }),
      () => json(200, { success: true, data: { id: 1 } }),
    ]
    for (const make of responses) {
      fetchMock = mockFetch()
      fetchMock.mockImplementation(async () => make())
      const error = await capture(fetchApi('/things', { schema: Thing }))
      expect(error.message).not.toContain(TOKEN)
      expect(error.path).not.toContain(TOKEN)
      expect(String(error)).not.toContain(TOKEN)
    }
  })
})
