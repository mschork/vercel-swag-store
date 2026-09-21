'use client'

import Link from 'next/link'
import {
  useActionState,
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from 'react'
import { addToCart, prepareCart, type AddToCartState } from '@/app/cart/actions'
import { useCartCount } from '@/components/cart/cart-count'
import { QuantityStepper } from '@/components/quantity-stepper'
import { useVisit } from '@/components/visit/visit-provider'
import { Button } from '@/components/ui/button'
import {
  addsInFlight,
  changeInFlight,
  subscribeInFlight,
  totalInFlight,
} from '@/lib/cart/adds-in-flight'

/** How long the button reads "Added" after a click. */
const ADDED_LABEL_MS = 1200

const FAILED: AddToCartState = { ok: false, error: 'This item could not be added. Try again.' }

// Once per page load: the first form to see intent opens the cart.
let cartPrepared = false

/**
 * Add to Cart as a Server Action form. `max` is what remains of the visit's
 * draw; `disabled` is set when nothing does or the count is unknown. It stays
 * a native Server Action form, so it works before hydration.
 *
 * With JavaScript the button does not wait for the save
 * (specs/E22-add-to-cart-wait.md). A submit calls the action and frees the
 * button; adds queue, and the quantities not yet answered count towards the
 * badge and against the stock at once. "View cart" stays inert until the last
 * one lands: a cart page opened before then would show a cart without it and
 * nothing would correct it. The cart is opened on intent, so the first add
 * finds it there.
 *
 * `shown` is an opening draw, posted with the form so an add that reaches the
 * server before any visit is held to the number on the page. An add waits for
 * an open call still in flight, so the action never opens a second visit
 * beside it.
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
  const [posted, formAction] = useActionState(addToCart, null)
  const [answered, setAnswered] = useState<AddToCartState>(null)
  const [justAdded, setJustAdded] = useState(false)
  const saving = useSyncExternalStore(
    subscribeInFlight,
    () => addsInFlight(productId) > 0,
    () => false,
  )
  const { confirm, setAdding } = useCartCount()
  const { confirmLine, pendingOpen, setAdding: setAddingForProduct } = useVisit()

  // The native path: a form posted before hydration answers through here.
  useEffect(() => {
    if (posted?.totalItems !== undefined) confirm(posted.totalItems)
    if (posted?.line) confirmLine(posted.line.productId, posted.line.quantity)
  }, [posted, confirm, confirmLine])

  const report = (delta: number) => {
    changeInFlight(productId, delta)
    setAdding(totalInFlight())
    setAddingForProduct(productId, addsInFlight(productId))
  }

  const prepare = () => {
    if (cartPrepared) return
    cartPrepared = true
    void prepareCart()
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const quantity = Number(data.get('quantity'))
    const count = Number.isInteger(quantity) && quantity > 0 ? quantity : 0
    report(count)
    setAnswered(null)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), ADDED_LABEL_MS)
    void (async () => {
      await pendingOpen()
      const result = await addToCart(null, data).catch(() => FAILED)
      // One batch, so the counts never show the add both saved and in flight.
      if (result?.totalItems !== undefined) confirm(result.totalItems)
      if (result?.line) confirmLine(result.line.productId, result.line.quantity)
      report(-count)
      // A failure stays on screen when a later add in the queue succeeds.
      setAnswered((previous) => (result?.ok && previous && !previous.ok ? previous : result))
    })()
  }

  const state = answered ?? posted
  return (
    <form
      action={formAction}
      onSubmit={submit}
      onPointerEnter={prepare}
      onFocus={prepare}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="productId" value={productId} />
      {shown === undefined ? null : <input type="hidden" name="shown" value={shown} />}
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <QuantityStepper name="quantity" min={1} max={max} disabled={disabled} />
        <Button type="submit" size="lg" disabled={disabled} className="h-11 md:flex-1">
          {justAdded ? 'Added' : 'Add to Cart'}
        </Button>
      </div>
      <p role="status" className="min-h-6 text-sm leading-6">
        {saving ? (
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
