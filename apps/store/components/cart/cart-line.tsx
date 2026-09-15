'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTransition } from 'react'
import {
  removeItem,
  updateQuantity,
  type CartActionResult,
} from '@/app/cart/actions'
import { QuantityStepper } from '@/components/quantity-stepper'
import { Button } from '@/components/ui/button'
import type { Line, LineChange } from '@/lib/cart/lines'
import { formatPrice } from '@/lib/format'
import { CART_MAX_QUANTITY } from '@/lib/quantity'
import { cn } from '@/lib/utils'

/**
 * One line of the cart. Each row has its own transition: while a change is
 * saving, the row dims and its controls ignore input, and other rows stay
 * usable. The status line is always rendered, so screen readers announce a
 * message when one appears.
 */
export function CartLine({
  line,
  currency,
  error,
  onChange,
  onResult,
}: {
  line: Line
  currency: string
  error: string | null
  onChange: (change: LineChange) => void
  onResult: (productId: string, error: string | null) => void
}) {
  const [pending, startTransition] = useTransition()

  const save = (quantity: number, action: () => Promise<CartActionResult>) =>
    startTransition(async () => {
      onChange({ productId: line.productId, quantity })
      const result = await action()
      startTransition(() =>
        onResult(line.productId, result.ok ? null : result.error),
      )
    })

  return (
    <li
      className={cn('py-4 transition-opacity', pending && 'opacity-60')}
      aria-busy={pending || undefined}
    >
      <div className="flex gap-4">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-bg-secondary sm:size-24">
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
                className="font-medium underline-offset-4 hover:underline"
              >
                {line.name}
              </Link>
              <p className="text-sm text-fg-secondary tabular-nums">
                {formatPrice(line.price, currency)} each
              </p>
            </div>
            <p className="font-medium tabular-nums">
              <span className="sr-only">Line total </span>
              {formatPrice(line.price * line.quantity, currency)}
            </p>
          </div>
          <div className="flex items-end justify-between gap-3">
            <QuantityStepper
              name="quantity"
              min={1}
              max={CART_MAX_QUANTITY}
              defaultValue={line.quantity}
              pending={pending}
              onCommit={(quantity) =>
                save(quantity, () => updateQuantity(line.productId, quantity))
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="lg"
              disabled={pending}
              aria-label={`Remove ${line.name}`}
              onClick={() => save(0, () => removeItem(line.productId))}
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
