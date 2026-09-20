'use client'

import { useFormStatus } from 'react-dom'
import { placeOrder } from '@/app/cart/actions'
import { Price } from '@/components/price'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

/**
 * Totals for the lines on screen, optimistic changes included, and the
 * Checkout form. The form's action is the `placeOrder` Server Action, so it
 * posts natively when hydration is slow or has failed. Sticky beside a long
 * list from lg.
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
      className="flex flex-col gap-4 rounded-lg border border-border bg-bg-secondary p-5 lg:sticky lg:top-20"
    >
      <h2 id="cart-summary" className="text-xl font-medium tracking-tight">
        Summary
      </h2>
      <dl className="flex flex-col gap-3">
        <div className="flex justify-between gap-4 text-sm">
          <dt className="text-fg-secondary">Items</dt>
          <dd className="font-mono tabular-nums">{totalItems}</dd>
        </div>
        <Separator />
        <div className="flex justify-between gap-4 text-base font-medium">
          <dt>Subtotal</dt>
          <dd>
            <Price cents={subtotal} currency={currency} className="text-base" />
          </dd>
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
    <Button type="submit" size="lg" disabled={pending} className="h-11 w-full">
      Checkout
    </Button>
  )
}
