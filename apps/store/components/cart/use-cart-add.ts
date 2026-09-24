'use client'

import { useCallback } from 'react'
import {
  addToCart,
  prepareCart,
  type AddToCartState,
  type CartActionResult,
} from '@/app/cart/actions'
import { useCartCount } from '@/components/cart/cart-count'
import { useVisit } from '@/components/visit/visit-provider'
import {
  addsInFlight,
  publishLines,
  settleAdd,
  startAdd,
  totalInFlight,
  type LineDisplay,
} from '@/lib/cart/adds-in-flight'
import { inOrder } from '@/lib/cart/in-order'

const FAILED: CartActionResult = { ok: false, error: 'This item could not be added. Try again.' }

// Once per page load: the first form to see intent opens the cart.
let cartPrepared = false

/**
 * Opens the visitor's cart on intent, so their first add finds it there and
 * costs one slow call.
 */
export function prepareOnIntent(): void {
  if (cartPrepared) return
  cartPrepared = true
  void inOrder(prepareCart)
}

/**
 * The add both Add to Cart forms share (docs/adr/0007-the-session-store.md).
 * `add` records the pending line at the click, calls the action behind any
 * cart write still saving (`inOrder`) and applies its answer in one batch:
 * the confirmed count, the line, the saved lines, the released quantity and
 * any failure, so no surface shows the add both saved and in flight. `apply`
 * takes an answer the native form post brought.
 */
export function useCartAdd() {
  const { confirm, setAdding } = useCartCount()
  const { confirmLine, setAdding: setAddingFor } = useVisit()

  const confirmAnswer = useCallback(
    (result: CartActionResult) => {
      if (result.totalItems !== undefined) confirm(result.totalItems)
      if (result.line) confirmLine(result.line.productId, result.line.quantity)
    },
    [confirm, confirmLine],
  )

  const apply = useCallback(
    (result: AddToCartState) => {
      if (!result) return
      confirmAnswer(result)
      if (result.lines) publishLines(result.lines)
    },
    [confirmAnswer],
  )

  const add = useCallback(
    async (
      productId: string,
      display: LineDisplay,
      quantity: number,
      data: FormData,
      onAnswer?: (result: CartActionResult) => void,
    ) => {
      const count = () => {
        setAdding(totalInFlight())
        setAddingFor(productId, addsInFlight(productId))
      }
      startAdd(productId, quantity, display)
      count()
      const result = (await inOrder(() => addToCart(null, data)).catch(() => null)) ?? FAILED
      confirmAnswer(result)
      settleAdd(productId, quantity, result)
      count()
      onAnswer?.(result)
    },
    [confirmAnswer, setAdding, setAddingFor],
  )

  return { add, apply }
}
