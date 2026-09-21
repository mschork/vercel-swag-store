import 'server-only'
import { getStock } from '@/lib/api/stock'
import { loadOptional } from '@/lib/load-optional'
import { CART_MAX_QUANTITY } from '@/lib/quantity'
import { getVisit, setVisit } from './cookie'

/**
 * How many of a product this visitor's visit says there are, drawing it and
 * writing it into the visit when the visit does not cover it yet. That happens
 * for a product added before the visit was topped up.
 *
 * With `open`, a visitor who has no visit gets one holding this product, so
 * the limit holds for a form posted before the browser opened a visit, or with
 * JavaScript off. `shown` is the opening draw the form carried, kept so the
 * number the visitor read is the limit (specs/E21-first-visit.md).
 *
 * `null` means there is nothing to enforce, and the caller enforces nothing:
 * the draw failed, or there is no visit and none is to be opened. Refusing an
 * add over a number the store could not read would be worse than the API's own
 * behaviour of accepting anything.
 */
export async function drawFor(
  productId: string,
  open?: { shown: number | undefined },
): Promise<number | null> {
  const visit = await getVisit()
  if (!visit && !open) return null
  const known = visit?.stock[productId]
  if (known !== undefined) return known

  const drawn = (!visit ? open?.shown : undefined) ?? (await fresh(productId))
  if (drawn === null) return null
  await setVisit(
    visit
      ? { ...visit, stock: { ...visit.stock, [productId]: drawn } }
      : { v: 1, drawnAt: Math.floor(Date.now() / 1000), stock: { [productId]: drawn }, promotion: null },
  )
  return drawn
}

async function fresh(productId: string): Promise<number | null> {
  const stock = await loadOptional(`Cart: stock for ${productId}`, () => getStock(productId))
  return stock ? Math.min(stock.stock, CART_MAX_QUANTITY) : null
}
