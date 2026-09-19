import { afterEach, describe, expect, it, vi } from 'vitest'
import { wakeAnalysis } from './index.ts'

afterEach(() => vi.unstubAllGlobals())

describe('wakeAnalysis', () => {
  it('posts to the store with the bearer secret', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    await wakeAnalysis('https://store.example', 's3cret')
    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
    expect(String(url)).toBe('https://store.example/api/demand/analyse')
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ authorization: 'Bearer s3cret' })
    expect(init.body).toBe('{"settle":true}')
  })

  it('throws on a 500, without the secret in the message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no', { status: 500 })))
    await expect(wakeAnalysis('https://store.example', 's3cret')).rejects.toThrow(/answered 500/)
    await expect(wakeAnalysis('https://store.example', 's3cret')).rejects.not.toThrow(/s3cret/)
  })

  it('throws when the function is not configured', async () => {
    await expect(wakeAnalysis(undefined, 's3cret')).rejects.toThrow('STORE_URL')
  })
})
