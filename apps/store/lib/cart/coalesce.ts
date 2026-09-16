/**
 * Holds back a stream of values and sends only the last one once the stream
 * pauses. The cart rows use it for quantity changes: the API takes an absolute
 * quantity, so the last value is the only one worth a slow round trip.
 * Pure and safe for client components; timers are the only side effect.
 */
export type Coalescer<T> = {
  /** Replaces the waiting value and restarts the pause. */
  push: (value: T) => void
  /** Sends the waiting value now, if there is one. */
  flush: () => void
  /** Drops the waiting value without sending it. */
  cancel: () => void
}

/** The pause after the last change before a cart row saves it. */
export const QUANTITY_PAUSE_MS = 400

export function createCoalescer<T>(
  delayMs: number,
  send: (value: T) => void,
): Coalescer<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  let waiting: { value: T } | undefined

  const cancel = () => {
    clearTimeout(timer)
    timer = undefined
    waiting = undefined
  }
  const flush = () => {
    const next = waiting
    cancel()
    if (next) send(next.value)
  }
  const push = (value: T) => {
    clearTimeout(timer)
    waiting = { value }
    timer = setTimeout(flush, delayMs)
  }
  return { push, flush, cancel }
}
