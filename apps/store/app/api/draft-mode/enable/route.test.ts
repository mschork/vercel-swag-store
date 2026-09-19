import { afterEach, describe, expect, it, vi } from 'vitest'

// next-sanity's handler imports `next/headers`, which resolves only inside the
// Next runtime; what this route owns is the switch in front of it.
const handler = vi.fn(async (request: Request) => {
  void request
  return new Response(null, { status: 307 })
})
vi.mock('next-sanity/draft-mode', () => ({
  defineEnableDraftMode: () => ({ GET: handler }),
}))

async function load(token: string) {
  vi.resetModules()
  vi.stubEnv('SANITY_API_READ_TOKEN', token)
  return import('./route')
}

afterEach(() => {
  vi.unstubAllEnvs()
  handler.mockClear()
})

describe('GET /api/draft-mode/enable', () => {
  const request = new Request('http://localhost/api/draft-mode/enable')

  it('answers 404 without the read token: the feature is off', async () => {
    const route = await load('')
    const response = await route.GET(request)
    expect(response.status).toBe(404)
    expect(handler).not.toHaveBeenCalled()
  })

  it("hands the request to next-sanity's handler when the token is set", async () => {
    const route = await load('viewer-token')
    const response = await route.GET(request)
    expect(handler).toHaveBeenCalledWith(request)
    expect(response.status).toBe(307)
  })
})
