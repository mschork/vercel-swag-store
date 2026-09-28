import { useSyncExternalStore } from 'react'
import { setDraft, type Drafts } from './lines'

/**
 * The quantities the cart page's changes are saving, by product id; a removal
 * is 0. A module store and not provider state, because Next keeps a visited
 * page mounted but hidden in `<Activity>`, where a context update waits until
 * the save answers; a component subscribed to this store renders the change
 * at once when its page is shown again.
 */

const NOTHING: Drafts = {}

let changes = NOTHING
const listeners = new Set<() => void>()

function commit(next: Drafts): void {
  if (next === changes) return
  changes = next
  for (const listener of listeners) listener()
}

export function subscribeChangesInFlight(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The current quantities; the same object until something changes. */
export function readChangesInFlight(): Drafts {
  return changes
}

export function useChangesInFlight(): Drafts {
  return useSyncExternalStore(subscribeChangesInFlight, readChangesInFlight, () => NOTHING)
}

/** Records the quantity a change of a product's line is saving. */
export function startChange(productId: string, quantity: number): void {
  commit(setDraft(changes, productId, quantity))
}

/**
 * Drops the change saving `quantity`, once its answer is applied. A newer
 * change of the same product stays.
 */
export function settleChange(productId: string, quantity?: number): void {
  commit(setDraft(changes, productId, null, quantity))
}
