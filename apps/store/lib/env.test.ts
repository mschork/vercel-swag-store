import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadEnv() {
  vi.resetModules()
  return import('./env')
}

describe('serverEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('exports the parsed environment', async () => {
    vi.stubEnv('API_BASE_URL', 'https://api.example.com/api')
    vi.stubEnv('API_BYPASS_TOKEN', 'secret')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://store.example.com')
    const { serverEnv } = await loadEnv()
    expect(serverEnv).toEqual({
      API_BASE_URL: 'https://api.example.com/api',
      API_BYPASS_TOKEN: 'secret',
      NEXT_PUBLIC_SITE_URL: 'https://store.example.com',
    })
  })

  it('defaults NEXT_PUBLIC_SITE_URL to localhost when unset or empty', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '')
    const { serverEnv } = await loadEnv()
    expect(serverEnv.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000')
  })

  it('names the missing variable and never echoes values', async () => {
    vi.stubEnv('API_BYPASS_TOKEN', '')
    await expect(loadEnv()).rejects.toThrow(/API_BYPASS_TOKEN/)
    await expect(loadEnv()).rejects.toThrow(/\.env\.example/)
  })

  it('rejects a base URL that is not a URL', async () => {
    vi.stubEnv('API_BASE_URL', 'not a url')
    await expect(loadEnv()).rejects.toThrow(/API_BASE_URL/)
  })
})
