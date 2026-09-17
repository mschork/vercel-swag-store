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
import { Price } from '@/components/price'
import { QuantityStepper } from '@/components/quantity-stepper'
import { Button } from '@/components/ui/button'
import {
  createCoalescer,
  QUANTITY_PAUSE_MS,
  type Coalescer,
} from '@/lib/cart/coalesce'
import type { Line, LineChange } from '@/lib/cart/lines'
import { CART_MAX_QUANTITY } from '@/lib/quantity'
import { cn } from '@/lib/utils'

/**
 * One line of the cart. Quantity changes wait for a short pause and then save
 * only the last value, so going from 1 to 5 is one request. During the pause
 * the row shows the value as a draft; while a save runs the row dims but keeps
 * taking clicks, and a newer value simply follows the running one. Leaving
 * the page during the pause saves at once. Remove drops any waiting value and
 * saves immediately. The status line is always rendered, so screen readers
 * announce a message when one appears.
 */
export function CartLine({
  line,
  currency,
  error,
  onChange,
  onDraft,
  onResult,
}: {
  line: Line
  currency: string
  error: string | null
  onChange: (change: LineChange) => void
  onDraft: (productId: string, quantity: number | null, onlyIf?: number) => void
  onResult: (productId: string, error: string | null) => void
}) {
  const { productId } = line
  const [pending, startTransition] = useTransition()
  const { confirm } = useCartCount()

  const save = (quantity: number, action: () => Promise<CartActionResult>) =>
    startTransition(async () => {
      onChange({ productId, quantity })
      // Held with the transition, so the draft gives way to the server's
      // lines only once they arrive, and never if a newer draft replaced it.
      onDraft(productId, null, quantity)
      const result = await action()
      startTransition(() => {
        if (result.totalItems !== undefined) confirm(result.totalItems)
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
      className={cn('py-4 transition-opacity', pending && 'opacity-60')}
      aria-busy={pending || undefined}
    >
      <div className="flex gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-bg-secondary">
          {line.image ? (
            <Image
              src={line.image}
              alt=""
              fill
              sizes="96px"
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
              max={CART_MAX_QUANTITY}
              defaultValue={line.quantity}
              labelClassName="sr-only md:not-sr-only"
              onCommit={change}
            />
            <Button
              type="button"
              variant="ghost"
              size="lg"
              aria-label={`Remove ${line.name}`}
              onClick={remove}
            >
              Remove
            </Button>
          </div>
        </div>
      </div>
      <p
        role="status"
        className={cn(
          'text-sm leading-6 text-danger',
          error ? 'mt-2' : 'sr-only',
        )}
      >
        {error}
      </p>
    </li>
  )
}
