import 'server-only'
import { cache } from 'react'
import { getPromotion } from '@/lib/api/promotions'
import { getStock } from '@/lib/api/stock'
import type { Promotion } from '@/lib/api/types'
import { loadOptional } from '@/lib/load-optional'
import { CART_MAX_QUANTITY } from '@/lib/quantity'
import { OPENING_DRAW_DEADLINE_MS } from './opening-limits'

/**
 * Opening draws (CONTEXT.md): what a render shows a visitor who has no visit
 * yet. Never cached. `undefined` means the API failed or missed the deadline,
 * and the caller renders what it renders while the visit is unknown.
 */
export async function openingStock(productId: string): Promise<number | undefined> {
  const stock = await withinDeadline(
    loadOptional(`Opening draw: stock for ${productId}`, () => getStock(productId)),
  )
  return stock ? Math.min(stock.stock, CART_MAX_QUANTITY) : undefined
}

/**
 * Memoized per request, so the banner renders the promotion the seed hands to
 * the client. `null` is the API saying there is none.
 */
export const openingPromotion = cache(async (): Promise<Promotion | null | undefined> => {
  const read = await withinDeadline(
    loadOptional('Opening draw: promotion', async () => ({ promotion: await getPromotion() })),
  )
  return read ? read.promotion : undefined
})

async function withinDeadline<T>(work: Promise<T>): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const deadline = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => resolve(undefined), OPENING_DRAW_DEADLINE_MS)
  })
  try {
    return await Promise.race([work, deadline])
  } finally {
    clearTimeout(timer)
  }
}
