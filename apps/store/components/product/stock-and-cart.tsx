import type { Product } from '@/lib/api/types'
import { drawFor } from '@/lib/visit/draw'
import { StockAndCartClient } from './stock-and-cart-client'

/**
 * The product page's only dynamic hole, rendered per request inside
 * `<Suspense>`. It shows the visit's draw for this product, drawn and claimed
 * here when the visit has none, so the buy panel never waits for the seed.
 * The session store keeps the first write, so the two show the same number
 * (docs/adr/0007-the-session-store.md).
 */
export async function StockAndCart({ product }: { product: Product }) {
  const draw = await drawFor(product.id)
  const { slug, name, price } = product
  return (
    <div className="flex flex-col gap-4">
      <StockAndCartClient
        productId={product.id}
        display={{ slug, name, image: product.images[0] ?? null, price }}
        serverDraw={draw}
      />
    </div>
  )
}
