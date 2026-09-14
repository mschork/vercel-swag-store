import { vi } from 'vitest'

/** A JSON `Response` in the API's envelope shape. */
export function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

export function ok(data: unknown, meta?: unknown, headers?: Record<string, string>) {
  return jsonResponse(200, meta === undefined ? { success: true, data } : { success: true, data, meta }, headers)
}

export function apiError(status: number, code: string, message: string, details?: unknown) {
  return jsonResponse(status, { success: false, error: { code, message, details } })
}

/** Installs a `fetch` mock for the current test; returns it for assertions. */
export function mockFetch() {
  const fetchMock = vi.fn<typeof fetch>()
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** The `[url, init]` of the nth fetch call, with strict-index safety. */
export function fetchCall(fetchMock: ReturnType<typeof mockFetch>, index = 0): [string, RequestInit] {
  const entry = fetchMock.mock.calls[index]
  if (!entry) throw new Error(`fetch was not called ${index + 1} time(s)`)
  return [String(entry[0]), entry[1] ?? {}]
}

export function headerOf(init: RequestInit, name: string): string | undefined {
  return (init.headers as Record<string, string> | undefined)?.[name]
}

export const product = (overrides: Record<string, unknown> = {}) => ({
  id: 'tshirt_001',
  name: 'Black Crewneck T-Shirt',
  slug: 'black-crewneck-t-shirt',
  description: 'Plain black tee.',
  price: 3000,
  currency: 'USD',
  category: 't-shirts',
  images: ['https://example.com/tee.png'],
  featured: true,
  tags: ['black', 'tee'],
  createdAt: '2025-01-10T10:00:00Z',
  ...overrides,
})

export const pagination = (overrides: Record<string, unknown> = {}) => ({
  page: 1,
  limit: 20,
  total: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  ...overrides,
})

export const rawCart = (overrides: Record<string, unknown> = {}) => ({
  token: 'body-token',
  items: [],
  totalItems: 0,
  subtotal: 0,
  currency: 'USD',
  createdAt: '2026-09-14T00:00:00Z',
  updatedAt: '2026-09-14T00:00:00Z',
  ...overrides,
})
