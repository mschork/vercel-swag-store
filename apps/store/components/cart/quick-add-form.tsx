'use client'

import { useActionState, useEffect, type FormEvent } from 'react'
import { useFormStatus } from 'react-dom'
import { addToCart } from '@/app/cart/actions'
import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import type { LineDisplay } from '@/lib/cart/adds-in-flight'
import { cn } from '@/lib/utils'
import { prepareOnIntent, useCartAdd } from './use-cart-add'

/**
 * Adds one of a product straight from the favourites row on the cart page.
 * A native `<form action>`, so it works before hydration, and it carries no
 * quantity control: one is what this row is for, and the visitor can change it
 * on the line it becomes.
 *
 * It needs no stock of its own. The row holds only products the visitor can
 * buy, and `addToCart` checks the draw anyway, so a card that goes out of date
 * between render and click is refused rather than mis-sold.
 *
 * With JavaScript a submit records a pending line with `display`, which the
 * cart view shows as a saving row, and the row hides this card at once
 * (`InCartHidden`). A failed add brings the card back, and the cart view says
 * why.
 */
export function QuickAddForm({
  productId,
  display,
}: {
  productId: string
  display: LineDisplay
}) {
  const [posted, formAction] = useActionState(addToCart, null)
  const { add, apply } = useCartAdd()

  // The native path: a form posted before hydration answers through here.
  useEffect(() => {
    apply(posted)
  }, [posted, apply])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void add(productId, display, 1, new FormData(event.currentTarget))
  }

  return (
    <form
      action={formAction}
      onSubmit={submit}
      onPointerEnter={prepareOnIntent}
      onFocus={prepareOnIntent}
      className="mt-2 flex flex-col gap-1"
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value="1" />
      <SubmitButton name={display.name} />
      {posted && !posted.ok ? (
        <p role="status" className="text-sm leading-5 text-danger">
          {posted.error}
        </p>
      ) : null}
    </form>
  )
}

function SubmitButton({ name }: { name: string }) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className={cn('w-full', pending && 'disabled:opacity-100')}
    >
      {pending ? <Spinner /> : null}
      {pending ? 'Adding…' : 'Add to Cart'}
      <span className="sr-only"> {name}</span>
    </Button>
  )
}
