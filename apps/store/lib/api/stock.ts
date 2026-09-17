import 'server-only'
import { fetchApi } from './client'
import { StockInfoSchema } from './schemas'
import type { StockInfo } from './types'

/**
 * Live data, never cached: the API changes the stock figure on every request,
 * so a cached value would be wrong the moment it was stored. Callers render
 * it inside `<Suspense>` so the page shell stays static.
 * Throws `ApiError` 404 for an unknown product.
 */
export async function getStock(productId: string): Promise<StockInfo> {
  const { data } = await fetchApi(`/products/${encodeURIComponent(productId)}/stock`, {
    cache: 'live',
    schema: StockInfoSchema,
  })
  return data
}
