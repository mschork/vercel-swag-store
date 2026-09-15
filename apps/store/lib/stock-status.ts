import type { StockInfo } from './api/types'

export type StockTone = 'success' | 'warning' | 'danger' | 'muted'

export type StockAvailability =
  | 'https://schema.org/InStock'
  | 'https://schema.org/OutOfStock'

export interface StockStatus {
  label: string
  tone: StockTone
  /** schema.org availability for the product's Offer; `null` when stock is unknown. */
  availability: StockAvailability | null
  /** Add to Cart is enabled only when the product is known to be in stock. */
  canAddToCart: boolean
  /** The largest quantity the stepper allows: the live count, 0 when unknown. */
  maxQuantity: number
}

/**
 * Everything the product page derives from live stock: the stock line, the
 * matching schema.org availability and what Add to Cart may do. The label
 * always carries the meaning, so colour is never the only cue. `null` stock
 * means the stock call failed: the page says so rather than guessing, and
 * Add to Cart stays disabled. Low stock is still in stock.
 */
export function stockStatus(stock: StockInfo | null): StockStatus {
  if (!stock) {
    return {
      label: 'Stock unavailable',
      tone: 'muted',
      availability: null,
      canAddToCart: false,
      maxQuantity: 0,
    }
  }
  const maxQuantity = stock.stock
  if (!stock.inStock) {
    return {
      label: 'Out of stock',
      tone: 'danger',
      availability: 'https://schema.org/OutOfStock',
      canAddToCart: false,
      maxQuantity,
    }
  }
  return {
    label: stock.lowStock ? `Only ${stock.stock} left` : 'In stock',
    tone: stock.lowStock ? 'warning' : 'success',
    availability: 'https://schema.org/InStock',
    canAddToCart: true,
    maxQuantity,
  }
}
