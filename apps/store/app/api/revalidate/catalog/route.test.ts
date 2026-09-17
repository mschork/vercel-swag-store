import { revalidateTag } from 'next/cache'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const SECRET = 'a'.repeat(64)

async function load(secret: string | undefined) {
  vi.resetModules()
  if (secret === undefined) delete process.env.CATALOG_REVALIDATE_SECRET
  else process.env.CATALOG_REVALIDATE_SECRET = secret
  return import('./route')
}

const call = (route: Awaited<ReturnType<typeof load>>, authorization?: string) =>
  route.POST(
    new Request('http://localhost/api/revalidate/catalog', {
      method: 'POST',
      headers: authorization ? { authorization } : {},
    }),
  )

beforeEach(() => {
  vi.mocked(revalidateTag).mockClear()
})

afterEach(() => {
  delete process.env.CATALOG_REVALIDATE_SECRET
})

describe('POST /api/revalidate/catalog', () => {
  it('expires the products, categories and store tags with the right secret', async () => {
    const route = await load(SECRET)
    const response = await call(route, `Bearer ${SECRET}`)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      revalidated: ['products', 'categories', 'store'],
    })
    expect(vi.mocked(revalidateTag).mock.calls).toEqual([
      ['products', { expire: 0 }],
      ['categories', { expire: 0 }],
      ['store', { expire: 0 }],
    ])
  })

  it.each([
    ['no header', undefined],
    ['a wrong secret', `Bearer ${'b'.repeat(64)}`],
    ['a shorter secret', 'Bearer aaa'],
    ['the secret without the scheme', SECRET],
    ['another scheme', `Basic ${SECRET}`],
  ])('refuses %s', async (_label, authorization) => {
    const route = await load(SECRET)
    const response = await call(route, authorization)
    expect(response.status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('refuses every call when no secret is configured', async () => {
    const route = await load(undefined)
    expect((await call(route, 'Bearer ')).status).toBe(401)
    expect((await call(route)).status).toBe(401)
    expect(revalidateTag).not.toHaveBeenCalled()
  })

  it('rejects a configured secret shorter than 32 characters at startup', async () => {
    await expect(load('too-short')).rejects.toThrow(/CATALOG_REVALIDATE_SECRET/)
  })
})
