import 'server-only'
import { getAllProducts } from '@/lib/api/products'
import { getStock } from '@/lib/api/stock'
import { loadOptional } from '@/lib/load-optional'
import { CART_MAX_QUANTITY } from '@/lib/quantity'
import {
  getSession,
  sessionStore,
  type Session,
  type Unavailable,
  type VisitRecord,
} from '@/lib/session/store'

/**
 * The visit, drawn by the server: each draw is read from the API and claimed
 * in the session store, where the first write wins, so every render that
 * draws the same product shows the same number
 * (docs/adr/0007-the-session-store.md). When the store is unavailable, the
 * API's answer is shown without being kept.
 */

/** Stock calls in flight at once; eight draw the catalogue in a second. */
const DRAW_CONCURRENCY = 8

/**
 * How many of a product the visit says there are, drawing and claiming it
 * when the visit has no draw for it. `null` when the API failed: there is
 * nothing to enforce, and the caller enforces nothing. A Server Action passes
 * the session it read, because `getSession` is not memoized inside an action.
 */
export async function drawFor(
  productId: string,
  current?: Session | Unavailable,
): Promise<number | null> {
  const session = current ?? (await getSession())
  if (session !== 'unavailable') {
    const kept = session.visit?.stock
    if (kept && Object.hasOwn(kept, productId)) return kept[productId] as number
  }
  const drawn = await drawOne(productId)
  if (drawn === null || session === 'unavailable') return drawn
  const won = await sessionStore.claimStock(session.sid, { [productId]: drawn })
  return won[productId] ?? drawn
}

/**
 * The visit drawn for the whole catalogue: every product `visit` has no draw
 * for is drawn and claimed. With no `sid` nothing is kept and the fresh draws are the answer. A draw
 * that fails is left out, and the product reads as having no count.
 *
 * `productIds` is the catalogue when the caller read it outside a Suspense
 * boundary; without it the catalogue is read here, which inside a boundary
 * is an API call on every request (`catalogueIds`).
 */
export async function completeVisit(
  sid: string | null,
  visit: VisitRecord | null,
  productIds?: readonly string[],
): Promise<Record<string, number>> {
  const kept = visit?.stock ?? {}
  const missing = (productIds ?? (await catalogueIds()) ?? []).filter(
    (id) => !Object.hasOwn(kept, id),
  )
  const drawn = await drawAll(missing)
  const won = sid ? await sessionStore.claimStock(sid, drawn) : drawn
  return { ...kept, ...won }
}

/**
 * Every product id in the catalogue, or `null` when it cannot be read. Called
 * outside a Suspense boundary it runs during the prerender, so the resumed
 * render finds its answer in the prerender's cache entries. Inside a boundary
 * it depends on the in-memory cache, which on Vercel is usually empty, so it
 * costs a catalogue call on most requests.
 */
export async function catalogueIds(): Promise<string[] | null> {
  const products = await loadOptional('Visit: catalogue', getAllProducts)
  return products?.map((product) => product.id) ?? null
}

/** Clamped to the cart's maximum, which is also the most the store keeps. */
async function drawOne(productId: string): Promise<number | null> {
  const stock = await loadOptional(`Visit: stock for ${productId}`, () => getStock(productId))
  return stock ? Math.min(stock.stock, CART_MAX_QUANTITY) : null
}

/** Draws every id, a few at a time; a draw that fails is left out. */
async function drawAll(ids: readonly string[]): Promise<Record<string, number>> {
  const queue = [...ids]
  const drawn: Record<string, number> = {}
  const workers = Array.from({ length: DRAW_CONCURRENCY }, async () => {
    for (;;) {
      const id = queue.shift()
      if (id === undefined) return
      const count = await drawOne(id)
      if (count !== null) drawn[id] = count
    }
  })
  await Promise.all(workers)
  return drawn
}
