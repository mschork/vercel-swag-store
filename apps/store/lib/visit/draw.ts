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
 * `null` means there is nothing to enforce, and the caller enforces nothing.
 * Either the visitor has no visit at all, which is the case only with
 * JavaScript off, where the store already degrades to what the API does; or
 * the draw failed, and refusing an add over a number the store could not read
 * would be worse than the API's own behaviour of accepting anything.
 */
export async function drawFor(productId: string): Promise<number | null> {
  const visit = await getVisit()
  if (!visit) return null
  const known = visit.stock[productId]
  if (known !== undefined) return known

  const stock = await loadOptional(`Cart: stock for ${productId}`, () => getStock(productId))
  if (!stock) return null
  const drawn = Math.min(stock.stock, CART_MAX_QUANTITY)
  await setVisit({ ...visit, stock: { ...visit.stock, [productId]: drawn } })
  return drawn
}
