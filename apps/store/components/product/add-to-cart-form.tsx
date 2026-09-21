'use client'

import Link from 'next/link'
import { startTransition, useActionState, useEffect, useState, type FormEvent } from 'react'
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
 *
 * `shown` is an opening draw, posted with the form so an add that reaches the
 * server before any visit is held to the number on the page. With JavaScript
 * the add waits for an open call still in flight, so the action never opens a
 * second visit beside it.
 */
export function AddToCartForm({
  productId,
  max,
  disabled,
  shown,
}: {
  productId: string
  max: number
  disabled: boolean
  shown?: number
}) {
  const [state, formAction, pending] = useActionState(addToCart, null)
  const { confirm } = useCartCount()
  const { confirmLine, pendingOpen } = useVisit()
  const [waiting, setWaiting] = useState(false)
  const submitAfterOpen = (event: FormEvent<HTMLFormElement>) => {
    const opening = pendingOpen()
    if (!opening) return
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setWaiting(true)
    void opening.then(() => {
      setWaiting(false)
      startTransition(() => formAction(data))
    })
  }
  useEffect(() => {
    if (state?.totalItems !== undefined) confirm(state.totalItems)
    if (state?.line) confirmLine(state.line.productId, state.line.quantity)
  }, [state, confirm, confirmLine])
  return (
    <form action={formAction} onSubmit={submitAfterOpen} className="flex flex-col gap-3">
      <input type="hidden" name="productId" value={productId} />
      {shown === undefined ? null : <input type="hidden" name="shown" value={shown} />}
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <QuantityStepper
          name="quantity"
          min={1}
          max={max}
          disabled={disabled}
        />
        <SubmitButton disabled={disabled} waiting={waiting} />
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

function SubmitButton({ disabled, waiting }: { disabled: boolean; waiting: boolean }) {
  const pending = useFormStatus().pending || waiting
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
