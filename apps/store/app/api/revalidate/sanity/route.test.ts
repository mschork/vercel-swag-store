import { createHmac } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const SECRET = 'a'.repeat(32)

async function load(secret: string | undefined) {
  vi.resetModules()
  if (secret === undefined) delete process.env.SANITY_REVALIDATE_SECRET
  else process.env.SANITY_REVALIDATE_SECRET = secret
  return import('./route')
}

/**
 * Sanity signs a delivery as `t=<timestamp>,v1=<base64url hmac>` over
 * `<timestamp>.<body>`; `parseBody` checks exactly that.
 */
function signed(body: unknown, secret = SECRET, timestamp = Date.now()) {
  const payload = JSON.stringify(body)
  const hmac = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('base64url')
  return new Request('http://localhost/api/revalidate/sanity', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'sanity-webhook-signature': `t=${timestamp},v1=${hmac}`,
    },
    body: payload,
  }) as unknown as NextRequest
}

beforeEach(() => {
  vi.mocked(revalidateTag).mockClear()
})

afterEach(() => {
  delete process.env.SANITY_REVALIDATE_SECRET
})

describe('POST /api/revalidate/sanity', () => {
  it('expires the type and the document when the signature is good', async () => {
    const route = await load(SECRET)
    const response = await route.POST(signed({ _type: 'homePage', _id: 'homePage' }))
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      revalidated: ['sanity:homePage', 'sanity:homePage'],
    })
    expect(vi.mocked(revalidateTag).mock.calls).toEqual([
      ['sanity:homePage', { expire: 0 }],
      ['sanity:homePage', { expire: 0 }],
    ])
  })

  it('expires one product without touching the API caches', async () => {
    const route = await load(SECRET)
    const response = await route.POST(
      signed({ _type: 'product', _id: 'product-hoodie_001' }),
    )
    expect(response.status).toBe(200)
    const tags = vi.mocked(revalidateTag).mock.calls.map(([tag]) => tag)
    expect(tags).toEqual(['sanity:product', 'sanity:product-hoodie_001'])
    expect(tags.some((tag) => ['products', 'categories', 'store'].includes(tag))).toBe(false)
  })

  it('refuses a request signed with the wrong secret', async () => {
    const route = await load(SECRET)
    const response = await route.POST(
      signed({ _type: 'faq', _id: 'faq-shipping' }, 'b'.repeat(32)),
    )
    expect(response.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('refuses an unsigned request', async () => {
    const route = await load(SECRET)
    const request = new Request('http://localhost/api/revalidate/sanity', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ _type: 'faq', _id: 'faq-shipping' }),
    }) as unknown as NextRequest
    expect((await route.POST(request)).status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('answers 400 when the body says nothing useful', async () => {
    const route = await load(SECRET)
    expect((await route.POST(signed({}))).status).toBe(400)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('refuses every call when no secret is configured', async () => {
    const route = await load(undefined)
    expect((await route.POST(signed({ _type: 'faq', _id: 'faq-shipping' }))).status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })
})
