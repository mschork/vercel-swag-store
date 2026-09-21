/**
 * The quantities of adds sent and not yet answered, keyed by product id
 * (specs/E22-add-to-cart-wait.md). A module store and not component state,
 * because a save outlives the form that started it: the visitor can leave the
 * page, or come back to it, while the API is still writing.
 */
const counts = new Map<string, number>()
const listeners = new Set<() => void>()

export function addsInFlight(productId: string): number {
  return counts.get(productId) ?? 0
}

export function totalInFlight(): number {
  let total = 0
  for (const count of counts.values()) total += count
  return total
}

/** Adds `delta` to a product's count; a count that reaches 0 is dropped. */
export function changeInFlight(productId: string, delta: number): void {
  const next = Math.max(0, addsInFlight(productId) + delta)
  if (next === 0) counts.delete(productId)
  else counts.set(productId, next)
  for (const listener of listeners) listener()
}

export function subscribeInFlight(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
