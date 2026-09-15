'use client'

import { useFormStatus } from 'react-dom'
import { placeOrder } from '@/app/cart/actions'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/format'

/**
 * Totals for the lines on screen, optimistic changes included, and the
 * Checkout form. The form's action is the `placeOrder` Server Action, so it
 * posts natively when hydration is slow or has failed.
 */
export function CartSummary({
  totalItems,
  subtotal,
  currency,
}: {
  totalItems: number
  subtotal: number
  currency: string
}) {
  return (
    <section
      aria-labelledby="cart-summary"
      className="flex flex-col gap-4 rounded-lg border border-border bg-bg-secondary p-4"
    >
      <h2 id="cart-summary" className="text-lg font-medium">
        Summary
      </h2>
      <dl className="flex flex-col gap-2">
        <div className="flex justify-between gap-4 text-sm">
          <dt className="text-fg-secondary">Items</dt>
          <dd className="tabular-nums">{totalItems}</dd>
        </div>
        <div className="flex justify-between gap-4 font-medium">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatPrice(subtotal, currency)}</dd>
        </div>
      </dl>
      <form action={placeOrder}>
        <CheckoutButton />
      </form>
    </section>
  )
}

function CheckoutButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="lg" disabled={pending} className="h-10 w-full">
      Checkout
    </Button>
  )
}
