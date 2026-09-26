'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useTransition } from 'react'
import {
  removeItem,
  updateQuantity,
  type CartActionResult,
} from '@/app/cart/actions'
import { useCartCount } from '@/components/cart/cart-count'
import { useVisit } from '@/components/visit/visit-provider'
import { Price } from '@/components/price'
import { Spinner } from '@/components/spinner'
import { QuantityStepper } from '@/components/quantity-stepper'
import { Button } from '@/components/ui/button'
import {
  createCoalescer,
  QUANTITY_PAUSE_MS,
  type Coalescer,
} from '@/lib/cart/coalesce'
import { inOrder } from '@/lib/cart/in-order'
import type { Line, LineChange } from '@/lib/cart/lines'
import { CART_MAX_QUANTITY } from '@/lib/quantity'
import { exceedsDraw, tooMany } from '@/lib/visit/limits'
import { cn } from '@/lib/utils'

/**
 * One line of the cart. Quantity changes wait for a short pause and then save
 * only the last value, so going from 1 to 5 is one request; leaving the page
 * during the pause saves at once. The status line is always rendered, so
 * screen readers announce a message when one appears.
 *
 * `draw` is what the visit says there is of the product, and caps the stepper.
 * A line already above it keeps its real quantity in the control, because a
 * row that silently showed fewer than the cart holds would be a lie; it says
 * how many there are instead, and the summary refuses to check out.
 *
 * A `pending` line holds an add that is still saving. It says so, and its
 * stepper and Remove take no input until the add answers.
 */
export function CartLine({
  line,
  currency,
  draw,
  pending = false,
  error,
  priority = false,
  onChange,
  onDraft,
  onSaved,
  onResult,
}: {
  line: Line
  currency: string
  draw: number | null
  pending?: boolean
  error: string | null
  /**
   * The first row's photo is the cart page's largest paint. It streams inside
   * the page's hole, so it cannot be preloaded from the shell; loading it
   * eagerly at least starts the request the moment the hole arrives.
   */
  priority?: boolean
  onChange: (change: LineChange) => void
  onDraft: (productId: string, quantity: number | null, onlyIf?: number) => void
  /**
   * The cart as the action saved it, from a success or a failure that read
   * it, which replaces the lines under the optimistic ones.
   */
  onSaved: (lines: Line[]) => void
  onResult: (productId: string, error: string | null) => void
}) {
  const { productId } = line
  const overDrawn = exceedsDraw(line.quantity, draw)
  const message = error ?? (overDrawn && draw !== null ? tooMany(draw) : null)
  const [changing, startTransition] = useTransition()
  const { confirm } = useCartCount()
  const { confirmLine } = useVisit()

  const save = (quantity: number, action: () => Promise<CartActionResult>) =>
    startTransition(async () => {
      onChange({ productId, quantity })
      // Held with the transition, so the draft gives way to the server's
      // lines only once they arrive, and never if a newer draft replaced it.
      onDraft(productId, null, quantity)
      const result = await inOrder(action)
      startTransition(() => {
        if (result.totalItems !== undefined) confirm(result.totalItems)
        if (result.lines) onSaved(result.lines)
        if (result.line) confirmLine(result.line.productId, result.line.quantity)
        onResult(productId, result.ok ? null : result.error)
      })
    })

  // The coalescer outlives renders; it calls whichever `save` is current.
  const saveQuantity = useRef<(quantity: number) => void>(() => {})
  useEffect(() => {
    saveQuantity.current = (quantity) =>
      save(quantity, () => updateQuantity(productId, quantity))
  })
  const waiting = useRef<Coalescer<number> | null>(null)
  useEffect(() => {
    const coalescer = createCoalescer<number>(QUANTITY_PAUSE_MS, (quantity) =>
      saveQuantity.current(quantity),
    )
    waiting.current = coalescer
    return () => {
      coalescer.flush()
      waiting.current = null
    }
  }, [])

  const change = (quantity: number) => {
    onDraft(productId, quantity)
    onResult(productId, null)
    if (waiting.current) waiting.current.push(quantity)
    else saveQuantity.current(quantity)
  }

  const remove = () => {
    waiting.current?.cancel()
    onDraft(productId, null)
    save(0, () => removeItem(productId))
  }

  return (
    <li
      className={cn('py-4 transition-opacity', changing && 'opacity-60')}
      aria-busy={changing || pending || undefined}
    >
      <div className="flex gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-bg-secondary">
          {line.image ? (
            <Image
              src={line.image}
              alt=""
              fill
              sizes="96px"
              priority={priority}
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <Link
                href={`/products/${line.slug}`}
                className="line-clamp-2 min-h-12 font-medium underline-offset-4 hover:underline lg:min-h-0"
              >
                {line.name}
              </Link>
              <p className="text-sm text-fg-secondary">
                <Price cents={line.price} currency={currency} size="sm" /> each
              </p>
            </div>
            <p className="font-medium">
              <span className="sr-only">Line total </span>
              <Price cents={line.price * line.quantity} currency={currency} />
            </p>
          </div>
          <div className="flex items-end justify-between gap-3">
            <QuantityStepper
              name="quantity"
              min={1}
              max={Math.max(draw ?? CART_MAX_QUANTITY, line.quantity)}
              defaultValue={line.quantity}
              pending={pending}
              labelClassName="sr-only md:not-sr-only"
              onCommit={change}
            />
            <Button
              type="button"
              variant="ghost"
              size="lg"
              aria-label={`Remove ${line.name}`}
              disabled={pending}
              className={cn(pending && 'disabled:opacity-100')}
              onClick={remove}
            >
              {/* While saving, the button's place says so, so the row keeps
                  its height; the status line below announces it. */}
              {pending ? (
                <>
                  <Spinner />
                  <span aria-hidden="true">Saving…</span>
                </>
              ) : (
                'Remove'
              )}
            </Button>
          </div>
        </div>
      </div>
      <p
        role="status"
        className={cn(
          'text-sm leading-6',
          pending ? 'text-fg-secondary' : 'text-danger',
          message && !pending ? 'mt-2' : 'sr-only',
        )}
      >
        {pending ? 'Saving…' : message}
      </p>
    </li>
  )
}
