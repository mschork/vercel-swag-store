import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const disable = vi.fn()
vi.mock('next/headers', () => ({ draftMode: async () => ({ disable }) }))

const { GET } = await import('./route')
const get = (query: string) =>
  GET(new NextRequest(`https://store.example/api/draft-mode/disable${query}`))

beforeEach(() => disable.mockClear())

describe('GET /api/draft-mode/disable', () => {
  it('disables draft mode and returns to the given path', async () => {
    const response = await get('?redirect=%2Fproducts%2Fhoodie')
    expect(disable).toHaveBeenCalledOnce()
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://store.example/products/hoodie')
  })

  it.each([
    'https://evil.example/',
    '//evil.example',
    '/\\evil.example',
    '/.//evil.example',
    '/..//evil.example/x',
    '/a/..//evil.example',
  ])(
    'refuses %s and goes home instead',
    async (target) => {
      const response = await get(`?redirect=${encodeURIComponent(target)}`)
      expect(response.headers.get('location')).toBe('https://store.example/')
    },
  )

  it('goes home when no path is given', async () => {
    const response = await get('')
    expect(response.headers.get('location')).toBe('https://store.example/')
  })
})
