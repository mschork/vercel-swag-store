import { useSyncExternalStore } from 'react'
import type { Line } from './lines'

/**
 * The browser's record of cart writes: the pending lines (CONTEXT.md) of adds
 * sent and not yet answered, the newest lines any cart action answered with,
 * and the adds that failed. A module store and not component state, because a
 * save outlives the form that started it: the visitor can open the cart, or
 * leave it, while the API is still writing. Redis never holds a pending line.
 */

/** What a cart row shows for a product, recorded at the click. */
export type LineDisplay = Pick<Line, 'slug' | 'name' | 'image' | 'price'>

/** One product's adds in flight: their total quantity and what its row shows. */
export type PendingLine = LineDisplay & { productId: string; quantity: number }

/** An add that failed, kept so the cart page can say why its row went. */
export type FailedAdd = { productId: string; name: string; error: string }

/** An answer's lines, numbered in the order the answers arrived. */
export type SavedAnswer = { version: number; lines: Line[] }

/** What a cart action answered, as far as this store reads it. */
export type CartAnswer = { ok: boolean; error?: string; lines?: Line[] }

export type AddsInFlight = {
  /** In the order their products were first clicked. */
  pending: readonly PendingLine[]
  saved: SavedAnswer | null
  /** One per product, with its latest message. */
  failures: readonly FailedAdd[]
  /**
   * The newest answer a page fetched by the latest navigation already
   * includes: every answer up to it arrived before its request left.
   */
  navigated: number
}

const NOTHING: AddsInFlight = { pending: [], saved: null, failures: [], navigated: 0 }

let state = NOTHING
const listeners = new Set<() => void>()

function commit(next: AddsInFlight): void {
  if (next === state) return
  state = next
  for (const listener of listeners) listener()
}

export function subscribeAddsInFlight(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The current record; the same object until something changes. */
export function readAddsInFlight(): AddsInFlight {
  return state
}

/** The record everywhere on the server and while hydrating: nothing pending. */
export function serverAddsInFlight(): AddsInFlight {
  return NOTHING
}

export function useAddsInFlight(): AddsInFlight {
  return useSyncExternalStore(subscribeAddsInFlight, readAddsInFlight, serverAddsInFlight)
}

export function addsInFlight(productId: string): number {
  return state.pending.find((line) => line.productId === productId)?.quantity ?? 0
}

export function totalInFlight(): number {
  return state.pending.reduce((total, line) => total + line.quantity, 0)
}

/**
 * Records an add at the click. It clears the failures, because the visitor
 * has moved on from them. A quantity below 1 adds no pending line.
 */
export function startAdd(productId: string, quantity: number, display: LineDisplay): void {
  const pending =
    quantity > 0
      ? state.pending.some((line) => line.productId === productId)
        ? state.pending.map((line) =>
            line.productId === productId
              ? { ...line, ...display, quantity: line.quantity + quantity }
              : line,
          )
        : [...state.pending, { productId, quantity, ...display }]
      : state.pending
  commit({ ...state, pending, failures: state.failures.length > 0 ? [] : state.failures })
}

/**
 * Applies an add's answer as one change: its quantity is released, its lines
 * become the newest saved lines, and a failure is kept under the product's
 * name. A subscriber never sees the add both saved and in flight.
 */
export function settleAdd(productId: string, quantity: number, answer: CartAnswer): void {
  const line = state.pending.find((entry) => entry.productId === productId)
  const left = (line?.quantity ?? 0) - quantity
  const pending = !line
    ? state.pending
    : left > 0
      ? state.pending.map((entry) => (entry === line ? { ...entry, quantity: left } : entry))
      : state.pending.filter((entry) => entry !== line)
  const failures =
    answer.ok || !line || quantity <= 0
      ? state.failures
      : [
          ...state.failures.filter((failure) => failure.productId !== productId),
          { productId, name: line.name, error: answer.error ?? '' },
        ]
  commit({ ...state, pending, failures, saved: answer.lines ? next(answer.lines) : state.saved })
}

/** Makes `lines` the newest saved lines, for an answer that had no add in flight. */
export function publishLines(lines: Line[]): void {
  commit({ ...state, saved: next(lines) })
}

/**
 * Records that a navigation started. A push or a replace fetches the page it
 * opens, so that page includes every answer so far; back and forward can
 * restore a page from the router's cache, which may predate any of them.
 */
export function noteNavigation(fetchesPage: boolean): void {
  const navigated = fetchesPage ? (state.saved?.version ?? 0) : 0
  if (navigated !== state.navigated) commit({ ...state, navigated })
}

export function dismissFailures(): void {
  if (state.failures.length > 0) commit({ ...state, failures: [] })
}

function next(lines: Line[]): SavedAnswer {
  return { version: (state.saved?.version ?? 0) + 1, lines }
}

/**
 * The saved lines a cart view shows, and the newest answer they include.
 * `rendered` is the lines the page was rendered with.
 */
export type HeldLines = { rendered: Line[]; lines: Line[]; version: number }

/**
 * What a cart view holds after this render: new `rendered` lines replace the
 * held ones, and then an answer newer than what they include replaces those.
 * The same object when nothing changed, so it can be set during render.
 */
export function holdLines(
  held: HeldLines | null,
  rendered: Line[],
  record: AddsInFlight,
): HeldLines {
  const current =
    held && held.rendered === rendered
      ? held
      : { rendered, lines: rendered, version: record.navigated }
  const answer = record.saved
  return answer && answer.version > current.version
    ? { rendered, lines: answer.lines, version: answer.version }
    : current
}

/** A line as the cart view shows it: `pending` while an add of it is saving. */
export type ShownLine = Line & { pending: boolean }

/**
 * The pending lines merged over the saved ones: a product already there has
 * its quantity raised, and a new one gets a row at the end.
 */
export function withPending(lines: readonly Line[], pending: readonly PendingLine[]): ShownLine[] {
  const shown = lines.map((line): ShownLine => {
    const add = pending.find((entry) => entry.productId === line.productId)
    return add
      ? { ...line, quantity: line.quantity + add.quantity, pending: true }
      : { ...line, pending: false }
  })
  for (const add of pending) {
    if (lines.some((line) => line.productId === add.productId)) continue
    const { productId, slug, name, image, price, quantity } = add
    shown.push({ productId, slug, name, image, price, quantity, pending: true })
  }
  return shown
}
