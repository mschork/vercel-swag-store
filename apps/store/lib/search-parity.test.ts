import { describe, expect, it } from 'vitest'
import { getAllProducts, getProducts } from '@/lib/api/products'
import { matchesQuery } from './search'

/**
 * Holds `matchesQuery` against the API's own `search`, which the store no
 * longer calls. Hits the live API: opt in with `API_INTEGRATION=1 pnpm test`,
 * as in `lib/api/integration.test.ts`.
 */
const QUERIES = [
  'mug', 'MUG', 'hat', 'hats', 'tee', 'black', 'steel', 'desk mat', 'black mug',
  'pen', 'bag', 'bags', 't-shirt', 'tshirt', 'sock', 'umbrella', 'x', 'ab', 'café',
]

describe.skipIf(!process.env.API_INTEGRATION)('search parity with the API', () => {
  it.each(QUERIES)('matches what the API finds for %j, in its order', async (query) => {
    const [catalogue, api] = await Promise.all([
      getAllProducts(),
      getProducts({ search: query, limit: 100 }),
    ])
    const local = catalogue.filter((product) => matchesQuery(product, query))
    expect(local.map((product) => product.id)).toEqual(api.products.map((product) => product.id))
  })
})
