/**
 * Runs the browser's cart writes one at a time, in the order they were asked
 * for. Next runs a browser's Server Actions one at a time only until a
 * navigation, which drops the action in flight from its queue and lets the
 * next one start beside it. Two writes side by side can each open a cart, or
 * save an older answer over a newer one.
 */
let last: Promise<unknown> = Promise.resolve()

export function inOrder<T>(write: () => Promise<T>): Promise<T> {
  const run = last.then(write)
  last = run.catch(() => undefined)
  return run
}
