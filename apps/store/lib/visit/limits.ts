/**
 * What a visit's draw allows, shared by the cart's Server Actions and the
 * cart page. Its own module, with no zod and nothing server-only, so a client
 * component can say the same thing the action enforces.
 */

/** Whether `quantity` is more of a product than the visit says there is. */
export function exceedsDraw(quantity: number, draw: number | null): boolean {
  return draw !== null && quantity > draw
}

/** What a visitor is told when they ask for more of a product than there is. */
export function tooMany(draw: number): string {
  return draw === 0 ? 'This product is out of stock.' : `Only ${draw} available.`
}
