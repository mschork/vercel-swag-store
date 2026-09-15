'use server'

import { z } from 'zod'

/**
 * Cart Server Actions. E05 ships `addToCart` as a stub so the product page
 * works on its own: it validates the form, logs the item and reports success.
 * E06 replaces the body with the API call and keeps the signature, adding the
 * cart to the success state.
 */

export type AddToCartState = { ok: true } | { ok: false; error: string } | null

// Server Action input is a trust boundary: anyone can post this form.
const AddToCartInput = z.object({
  productId: z.string().trim().min(1),
  quantity: z.coerce.number().int().positive(),
})

export async function addToCart(
  _previous: AddToCartState,
  formData: FormData,
): Promise<AddToCartState> {
  const input = AddToCartInput.safeParse({
    productId: formData.get('productId'),
    quantity: formData.get('quantity'),
  })
  if (!input.success) {
    const badQuantity = input.error.issues.some(
      (issue) => issue.path[0] === 'quantity',
    )
    return {
      ok: false,
      error: badQuantity
        ? 'Choose a whole quantity of at least 1.'
        : 'This item could not be added.',
    }
  }
  console.info('[cart] addToCart stub (E06 calls the API)', input.data)
  return { ok: true }
}
