'use client'

import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { addToCart } from '@/app/cart/actions'
import { useCartCount } from '@/components/cart/cart-count'
import { QuantityStepper } from '@/components/quantity-stepper'
import { useVisit } from '@/components/visit/visit-provider'
import { AddingCount } from './adding-count'
import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Add to Cart as a Server Action form. `max` is what remains of the visit's
 * draw; `disabled` is set when nothing does or the count is unknown. It stays
 * a native Server Action form, so it works before hydration. With JavaScript
 * the add is optimistic, and "View cart" stays inert until the write lands: a
 * cart page opened before then would show a cart without it and nothing would
 * correct it.
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
  const { confirmLine } = useVisit()
  useEffect(() => {
    if (state?.totalItems !== undefined) confirm(state.totalItems)
    if (state?.line) confirmLine(state.line.productId, state.line.quantity)
  }, [state, confirm, confirmLine])
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
      <AddingCount productId={productId} />
      <p role="status" className="min-h-6 text-sm leading-6">
        {pending ? (
          <>
            Added.{' '}
            <span
              role="link"
              aria-disabled="true"
              className="text-fg-secondary underline underline-offset-4"
            >
              View cart
            </span>
          </>
        ) : !state ? null : state.ok ? (
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
