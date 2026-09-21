import { getAllProducts } from '@/lib/api/products'
import { getPromotion } from '@/lib/api/promotions'
import { getStock } from '@/lib/api/stock'
import { loadOptional } from '@/lib/load-optional'
import { CART_MAX_QUANTITY } from '@/lib/quantity'
import { clearVisit, getVisit, setVisit } from '@/lib/visit/cookie'
import { readHandBack } from '@/lib/visit/hand-back'
import type { OpenedVisit } from '@/lib/visit/open'
import type { Visit } from '@/lib/visit/visit'

/**
 * Opens or tops up the visitor's visit and answers with it
 * (specs/E19-stable-visit.md). The browser calls this once, because a page
 * cannot set a cookie; a Server Action could, but actions run one at a time
 * per client, so an Add to Cart clicked during the draws would queue behind
 * them.
 *
 * Its only input is the opening draws the first render showed
 * (`readHandBack`), kept where the visit holds nothing, so the visit holds the
 * numbers the visitor already read. It returns only the caller's own visit,
 * and a cross-site form cannot send the JSON it reads, so a cross-site POST
 * achieves nothing.
 */

/** Stock calls in flight at once. Eight draws the catalogue in about a second. */
const DRAW_CONCURRENCY = 8

export async function POST(request: Request): Promise<Response> {
  const [existing, handed] = await Promise.all([getVisit(), readHandBack(request)])
  const products = await getAllProducts()
  const stock: Record<string, number> = { ...(existing?.stock ?? {}) }
  const { draw: shown } = handed
  if (shown && !(shown.productId in stock) && products.some((p) => p.id === shown.productId)) {
    stock[shown.productId] = shown.count
  }

  const missing = products.map((product) => product.id).filter((id) => !(id in stock))
  const [drawn, promotion] = await Promise.all([
    draw(missing),
    existing?.promotion ?? handed.promotion ?? loadOptional('Visit: promotion', getPromotion),
  ])
  for (const [id, count] of drawn) stock[id] = count

  const visit: Visit = {
    v: 1,
    drawnAt: existing?.drawnAt ?? Math.floor(Date.now() / 1000),
    stock,
    promotion,
  }
  const dropped = await setVisit(visit)
  if (dropped.length > 0) {
    console.warn(`[visit] cookie full, ${dropped.length} products left without a count`)
  }
  const body: OpenedVisit = {
    stock: Object.fromEntries(
      Object.entries(visit.stock).filter(([id]) => !dropped.includes(id)),
    ),
    promotion: visit.promotion,
  }
  return Response.json(body)
}

/** Forgets the visit, so the next call draws fresh stock and a fresh promotion. */
export async function DELETE(): Promise<Response> {
  await clearVisit()
  return Response.json({ ok: true })
}

/**
 * Draws every id, a few at a time. A draw that fails is left out rather than
 * failing the rest: the product renders "Stock unavailable" until the next
 * call fills it in.
 */
async function draw(ids: readonly string[]): Promise<[string, number][]> {
  const queue = [...ids]
  const drawn: [string, number][] = []
  const workers = Array.from({ length: DRAW_CONCURRENCY }, async () => {
    for (;;) {
      const id = queue.shift()
      if (!id) return
      const stock = await loadOptional(`Visit: stock for ${id}`, () => getStock(id))
      // Clamped, because a count the schema rejects would make the whole
      // cookie unreadable on the next request.
      if (stock) drawn.push([id, Math.min(stock.stock, CART_MAX_QUANTITY)])
    }
  })
  await Promise.all(workers)
  return drawn
}
