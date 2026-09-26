'use client'

import { useActionState, useEffect, type FormEvent, type ReactNode } from 'react'
import { addToCart } from '@/app/cart/actions'
import type { LineDisplay } from '@/lib/cart/adds-in-flight'
import { cn } from '@/lib/utils'
import { prepareOnIntent, useCartAdd } from './use-cart-add'

/**
 * Adds one of a product straight from the favourites row on the cart page:
 * the whole card, `children`, is the submit button, with `className` from the
 * card. A native `<form action>`, so it works before hydration, and it carries
 * no quantity control: one is what this row is for, and the visitor can change
 * it on the line it becomes.
 *
 * It needs no stock of its own. The row holds only products the visitor can
 * buy, and `addToCart` checks the draw anyway, so a card that goes out of date
 * between render and click is refused rather than mis-sold.
 *
 * With JavaScript a submit records a pending line with `display`, which the
 * cart view shows as a saving row, and the row hides this card at once
 * (`BuyableItems`). A failed add brings the card back, and the cart view says
 * why.
 */
export function QuickAddForm({
  productId,
  display,
  className,
  children,
}: {
  productId: string
  display: LineDisplay
  className: string
  children: ReactNode
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
      className="flex h-full flex-col gap-1"
    >
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value="1" />
      <button
        type="submit"
        aria-label={`Add ${display.name} to cart`}
        className={cn(className, 'w-full flex-1 cursor-pointer text-left')}
      >
        {children}
      </button>
      {posted && !posted.ok ? (
        <p role="status" className="text-sm leading-5 text-danger">
          {posted.error}
        </p>
      ) : null}
    </form>
  )
}
