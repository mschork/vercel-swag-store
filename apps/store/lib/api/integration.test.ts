import { describe, expect, it } from 'vitest'
import { getProducts } from './products'
import { getHealth } from './store'

/**
 * Hits the live API. Opt in with `API_INTEGRATION=1 pnpm test`; needs a real
 * `.env.local` (loaded by vitest.config.mts). Skipped by default so unit
 * runs never depend on the network.
 */
describe.skipIf(!process.env.API_INTEGRATION)('live API', () => {
  it('GET /health reports ok', async () => {
    const health = await getHealth()
    expect(health.status).toBe('ok')
  })

  it('GET /products?limit=1 returns one product with pagination', async () => {
    const { products, pagination } = await getProducts({ limit: 1 })
    expect(products).toHaveLength(1)
    expect(pagination.limit).toBe(1)
    expect(pagination.total).toBeGreaterThan(0)
  })
})
