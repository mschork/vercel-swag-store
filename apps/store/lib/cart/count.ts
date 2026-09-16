/**
 * The header badge's number, from four sources. Pure and safe for client
 * components.
 *
 * - `server`: the count the badge read while rendering; `null` when that read
 *   failed, `undefined` when the render skipped it.
 * - `confirmed`: the confirmed count (CONTEXT.md), the latest count the API
 *   reported through an action or a render; `undefined` until one arrives on
 *   the client.
 * - `adding`: items of an Add to Cart still in flight, shown ahead of the API.
 * - `cartPage`: the total the cart page shows while it is open, drafts and
 *   optimistic changes included, so the badge never disagrees with it.
 *
 * `null` means unknown: the badge shows no number rather than a guess.
 */
export type CountSources = {
  server: number | null | undefined
  confirmed: number | null | undefined
  adding: number
  cartPage: number | null
}

export function shownCount({
  server,
  confirmed,
  adding,
  cartPage,
}: CountSources): number | null {
  if (cartPage !== null) return cartPage
  const base = confirmed === undefined ? (server ?? null) : confirmed
  return base === null ? null : base + adding
}

/**
 * The confirmed count after an action. A result without a count (a rejected
 * input, a write that failed before the cart was read) leaves it unchanged.
 */
export function confirmedAfter(
  confirmed: number | null | undefined,
  result: { totalItems?: number } | null,
): number | null | undefined {
  return result?.totalItems ?? confirmed
}
