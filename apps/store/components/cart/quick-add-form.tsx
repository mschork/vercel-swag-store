'use client'

import { useActionState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { addToCart } from '@/app/cart/actions'
import { useCartCount } from '@/components/cart/cart-count'
import { AddingCount } from '@/components/product/adding-count'
import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import { useVisit } from '@/components/visit/visit-provider'
import { cn } from '@/lib/utils'

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
 * Once the write lands, `refresh()` re-renders the page and the row drops this
 * product, because it is now in the cart, and slides the next favourite in.
 */
export function QuickAddForm({
  productId,
  name,
}: {
  productId: string
  name: string
}) {
  const [state, formAction] = useActionState(addToCart, null)
  const { confirm } = useCartCount()
  const { confirmLine } = useVisit()
  useEffect(() => {
    if (state?.totalItems !== undefined) confirm(state.totalItems)
    if (state?.line) confirmLine(state.line.productId, state.line.quantity)
  }, [state, confirm, confirmLine])

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-1">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="quantity" value="1" />
      <AddingCount productId={productId} />
      <SubmitButton name={name} />
      {state && !state.ok ? (
        <p role="status" className="text-sm leading-5 text-danger">
          {state.error}
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
