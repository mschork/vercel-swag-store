'use client'

import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { addToCart } from '@/app/cart/actions'
import { useCartCount } from '@/components/cart/cart-count'
import { QuantityStepper } from '@/components/quantity-stepper'
import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Add to Cart as a Server Action form. `max` is live stock and `disabled` is
 * set when the product is out of stock or its stock is unknown. The result
 * shows inline in a polite status line, cleared while the next submit is
 * pending; the line keeps its height so nothing moves when it fills. While the
 * action runs the button turns a spinner and reads "Adding…", at full
 * strength so the visitor sees the click was taken.
 *
 * The action answers with the cart's count, which goes straight to the
 * badge. The form stays a native Server Action form, so it works before
 * hydration.
 */
export function AddToCartForm({
  productId,
  max,
  disabled,
}: {
  productId: string
  max: number
  disabled: boolean
}) {
  const [state, formAction, pending] = useActionState(addToCart, null)
  const { confirm } = useCartCount()
  useEffect(() => {
    if (state?.totalItems !== undefined) confirm(state.totalItems)
  }, [state, confirm])
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <QuantityStepper
          name="quantity"
          min={1}
          max={max}
          disabled={disabled}
        />
        <SubmitButton disabled={disabled} />
      </div>
      <p role="status" className="min-h-6 text-sm leading-6">
        {pending || !state ? null : state.ok ? (
          <>
            Added.{' '}
            <Link href="/cart" className="underline underline-offset-4">
              View cart
            </Link>
          </>
        ) : (
          <span className="text-danger">{state.error}</span>
        )}
      </p>
    </form>
  )
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      size="lg"
      disabled={disabled || pending}
      className={cn('h-11 md:flex-1', pending && 'disabled:opacity-100')}
    >
      {pending ? (
        <>
          <Spinner />
          Adding…
        </>
      ) : (
        'Add to Cart'
      )}
    </Button>
  )
}
