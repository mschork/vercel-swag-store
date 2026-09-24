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
    vi.stubEnv('NEXT_PUBLIC_SANITY_PROJECT_ID', 'project')
    vi.stubEnv('NEXT_PUBLIC_SANITY_DATASET', 'production')
    const { serverEnv } = await loadEnv()
    expect(serverEnv).toEqual({
      API_BASE_URL: 'https://api.example.com/api',
      API_BYPASS_TOKEN: 'secret',
      NEXT_PUBLIC_SITE_URL: 'https://store.example.com',
      NEXT_PUBLIC_SANITY_PROJECT_ID: 'project',
      NEXT_PUBLIC_SANITY_DATASET: 'production',
      // Both revalidation secrets are optional: unset, their routes refuse.
      CATALOG_REVALIDATE_SECRET: undefined,
      SANITY_REVALIDATE_SECRET: undefined,
      // Unset, nobody may frame the store.
      PRESENTATION_STUDIO_ORIGINS: [],
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

  it('parses the Studio origins and refuses a wildcard', async () => {
    vi.stubEnv('PRESENTATION_STUDIO_ORIGINS', 'https://a.example,https://b.example')
    expect((await loadEnv()).serverEnv.PRESENTATION_STUDIO_ORIGINS).toEqual([
      'https://a.example',
      'https://b.example',
    ])
    vi.stubEnv('PRESENTATION_STUDIO_ORIGINS', 'https://*.vercel.app')
    await expect(loadEnv()).rejects.toThrow(/PRESENTATION_STUDIO_ORIGINS/)
  })

  it('reads the session store and the test seed switch, and refuses a seed value other than 1', async () => {
    vi.stubEnv('KV_REST_API_URL', 'https://redis.example.com')
    vi.stubEnv('KV_REST_API_TOKEN', 'redis-token')
    vi.stubEnv('E2E_SEED', '1')
    const { serverEnv } = await loadEnv()
    expect(serverEnv).toMatchObject({
      KV_REST_API_URL: 'https://redis.example.com',
      KV_REST_API_TOKEN: 'redis-token',
      E2E_SEED: '1',
    })
    vi.stubEnv('E2E_SEED', 'true')
    await expect(loadEnv()).rejects.toThrow(/E2E_SEED/)
  })

  it('rejects a base URL that is not a URL', async () => {
    vi.stubEnv('API_BASE_URL', 'not a url')
    await expect(loadEnv()).rejects.toThrow(/API_BASE_URL/)
  })
})
