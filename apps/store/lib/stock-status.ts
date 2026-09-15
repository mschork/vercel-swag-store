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
}

/**
 * What the product page says about live stock, and the matching schema.org
 * availability. The label always carries the meaning, so colour is never the
 * only cue. `null` stock means the stock call failed: the page says so rather
 * than guessing, and Add to Cart stays disabled. Low stock is still in stock.
 */
export function stockStatus(stock: StockInfo | null): StockStatus {
  if (!stock) {
    return { label: 'Stock unavailable', tone: 'muted', availability: null }
  }
  if (!stock.inStock) {
    return {
      label: 'Out of stock',
      tone: 'danger',
      availability: 'https://schema.org/OutOfStock',
    }
  }
  if (stock.lowStock) {
    return {
      label: `Only ${stock.stock} left`,
      tone: 'warning',
      availability: 'https://schema.org/InStock',
    }
  }
  return {
    label: 'In stock',
    tone: 'success',
    availability: 'https://schema.org/InStock',
  }
}
