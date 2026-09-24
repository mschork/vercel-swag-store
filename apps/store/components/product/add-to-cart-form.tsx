'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState, type FormEvent } from 'react'
import { addToCart, type AddToCartState } from '@/app/cart/actions'
import { prepareOnIntent, useCartAdd } from '@/components/cart/use-cart-add'
import { QuantityStepper } from '@/components/quantity-stepper'
import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import { useAddsInFlight, type LineDisplay } from '@/lib/cart/adds-in-flight'

/** How long the button spins after a click: an acknowledgement, not the save. */
const ADDING_LABEL_MS = 1000

/**
 * Add to Cart as a Server Action form. `max` is what remains of the visit's
 * draw; `disabled` is set when nothing does or the count is unknown. It stays
 * a native Server Action form, so it works before hydration.
 *
 * With JavaScript the button does not wait for the save
 * (specs/E22-add-to-cart-wait.md). A submit records a pending line with
 * `display`, calls the action and frees the button; adds queue, and the
 * quantities not yet answered count towards the badge and against the stock
 * at once. "View cart" is a link from the click on, because the cart page
 * shows a pending line as a saving row. The cart is opened on intent, so the
 * first add finds it there.
 */
export function AddToCartForm({
  productId,
  display,
  max,
  disabled,
}: {
  productId: string
  display: LineDisplay
  max: number
  disabled: boolean
}) {
  const [posted, formAction] = useActionState(addToCart, null)
  const [answered, setAnswered] = useState<AddToCartState>(null)
  const [justClicked, setJustClicked] = useState(false)
  const spinning = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const saving = useAddsInFlight().pending.some((line) => line.productId === productId)
  const { add, apply } = useCartAdd()

  // The native path: a form posted before hydration answers through here.
  useEffect(() => {
    apply(posted)
  }, [posted, apply])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const quantity = Number(data.get('quantity'))
    const count = Number.isInteger(quantity) && quantity > 0 ? quantity : 0
    setAnswered(null)
    setJustClicked(true)
    // A second click restarts the second, so the first timer cannot cut it short.
    clearTimeout(spinning.current)
    spinning.current = setTimeout(() => setJustClicked(false), ADDING_LABEL_MS)
    void add(productId, display, count, data, (result) =>
      // A failure stays on screen when a later add in the queue succeeds.
      setAnswered((previous) => (result.ok && previous && !previous.ok ? previous : result)),
    )
  }

  const state = answered ?? posted
  return (
    <form
      action={formAction}
      onSubmit={submit}
      onPointerEnter={prepareOnIntent}
      onFocus={prepareOnIntent}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="productId" value={productId} />
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <QuantityStepper name="quantity" min={1} max={max} disabled={disabled} />
        <Button type="submit" size="lg" disabled={disabled} className="h-11 md:flex-1">
          {justClicked ? (
            <>
              <Spinner />
              Adding…
            </>
          ) : (
            'Add to Cart'
          )}
        </Button>
      </div>
      <p role="status" className="min-h-6 text-sm leading-6">
        {saving || state?.ok ? (
          <>
            Added.{' '}
            <Link href="/cart" className="underline underline-offset-4">
              View cart
            </Link>
          </>
        ) : state ? (
          <span className="text-danger">{state.error}</span>
        ) : null}
      </p>
    </form>
  )
}
