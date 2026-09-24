/**
 * The visit's stock draws with an order's lines taken off them, never below
 * nothing, as the whole map to write back. Buying is the one thing that
 * reduces stock for good: everything else a visitor does to their cart is
 * given back when they undo it.
 */
export function afterOrder(
  stock: Readonly<Record<string, number>>,
  lines: readonly { productId: string; quantity: number }[],
): Record<string, number> {
  const after = { ...stock }
  for (const { productId, quantity } of lines) {
    const draw = after[productId]
    if (draw !== undefined) after[productId] = Math.max(0, draw - quantity)
  }
  return after
}
