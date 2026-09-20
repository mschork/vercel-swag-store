/**
 * Most of one product a cart line holds, shared by the cart stepper and the
 * `updateQuantity` action. Cart writes are not stock-checked by the API; stock
 * is enforced only when adding on the product page.
 */
export const CART_MAX_QUANTITY = 99

/**
 * A quantity clamped to a whole number in `[min, max]`, for the stepper on the
 * product page and the cart rows. Pure and safe for client components. When
 * `max` is below `min` (a product out of stock) the range collapses to `min`,
 * so the value stays valid while the control is disabled.
 */
export function clampQuantity(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  const upper = Math.max(min, max)
  return Math.min(upper, Math.max(min, Math.trunc(value)))
}

/** Typed input as a valid quantity; empty or non-numeric text becomes `min`. */
export function parseQuantity(raw: string, min: number, max: number): number {
  const trimmed = raw.trim()
  return clampQuantity(trimmed === '' ? Number.NaN : Number(trimmed), min, max)
}

/** Whether the minus and plus buttons can act on `value`. */
export function stepperState(
  value: number,
  min: number,
  max: number,
): { canDecrement: boolean; canIncrement: boolean } {
  return { canDecrement: value > min, canIncrement: value < max }
}
