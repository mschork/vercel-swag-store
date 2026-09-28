import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const catalogue = { categories: [{ slug: 'hats', name: 'Hats' }], products: [] }
const mocks = vi.hoisted(() => ({
  fetchCatalogue: vi.fn(),
  syncCatalogue: vi.fn(),
  createClient: vi.fn(() => ({ id: 'client' })),
}))
vi.mock('@sanity/client', () => ({ createClient: mocks.createClient }))
vi.mock('@repo/sanity/catalogue-sync', () => ({
  fetchCatalogue: mocks.fetchCatalogue,
  syncCatalogue: mocks.syncCatalogue,
}))

const { handler } = await import('./index.ts')

type Args = Parameters<typeof handler>[0]
const call = (local = false, clientOptions: { token?: string } = { token: 'robot' }) =>
  handler({ context: { local, clientOptions } } as unknown as Args)

beforeEach(() => {
  vi.stubEnv('API_BASE_URL', 'https://api.test')
  vi.stubEnv('API_BYPASS_TOKEN', 'bypass')
  vi.stubEnv('SANITY_PROJECT_ID', 'p')
  vi.stubEnv('SANITY_DATASET', 'production')
  mocks.fetchCatalogue.mockReset().mockResolvedValue(catalogue)
  mocks.syncCatalogue.mockReset().mockResolvedValue({ created: 0, updated: 0, flagged: 0, categorySlugs: [] })
  mocks.createClient.mockClear()
})
afterEach(() => vi.unstubAllEnvs())

describe('catalogue-sync', () => {
  it('syncs with the robot token and the project the blueprint names', async () => {
    await call()
    expect(mocks.fetchCatalogue).toHaveBeenCalledWith({ baseUrl: 'https://api.test', bypassToken: 'bypass' })
    expect(mocks.createClient).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'p', dataset: 'production', token: 'robot', useCdn: false }),
    )
    expect(mocks.syncCatalogue).toHaveBeenCalledExactlyOnceWith({ id: 'client' }, catalogue)
  })

  it('writes nothing on a local test run', async () => {
    await call(true)
    expect(mocks.syncCatalogue).not.toHaveBeenCalled()
  })

  it('writes nothing when the API fails', async () => {
    mocks.fetchCatalogue.mockRejectedValue(new Error('API /products?page=1&limit=50 answered 503'))
    await expect(call()).rejects.toThrow('503')
    expect(mocks.syncCatalogue).not.toHaveBeenCalled()
  })

  it('refuses to run without the API variables or the robot token', async () => {
    vi.stubEnv('API_BYPASS_TOKEN', '')
    await expect(call()).rejects.toThrow('API_BYPASS_TOKEN is not set')
    vi.stubEnv('API_BYPASS_TOKEN', 'bypass')
    await expect(call(false, {})).rejects.toThrow('no robot token')
    expect(mocks.syncCatalogue).not.toHaveBeenCalled()
  })
})
