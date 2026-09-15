'use client'

import { useOptimistic, useState } from 'react'
import { applyLineChange, cartTotals, type Line } from '@/lib/cart/lines'
import { CartLine } from './cart-line'
import { CartSummary } from './cart-summary'
import { EmptyCart } from './empty-cart'

/**
 * The cart page's client leaf. Lines live in `useOptimistic`, so a quantity
 * change or a removal shows at once and the totals follow. The server's answer
 * arrives through `refresh()` in the same round trip and replaces `lines`; a
 * failed change reverts on its own when its transition ends.
 *
 * Messages are kept here, keyed by product, rather than in the rows: a row
 * removed optimistically unmounts, and if the removal fails the row comes
 * back and still has to show why.
 */
export function CartView({
  lines,
  currency,
}: {
  lines: Line[]
  currency: string
}) {
  const [optimisticLines, applyChange] = useOptimistic(lines, applyLineChange)
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({})

  const report = (productId: string, error: string | null) =>
    setErrors((current) => {
      if (error !== null) return { ...current, [productId]: error }
      if (!(productId in current)) return current
      const next = { ...current }
      delete next[productId]
      return next
    })

  if (optimisticLines.length === 0) return <EmptyCart />
  const { totalItems, subtotal } = cartTotals(optimisticLines)

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start">
      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {optimisticLines.map((line) => (
          <CartLine
            key={line.productId}
            line={line}
            currency={currency}
            error={errors[line.productId] ?? null}
            onChange={applyChange}
            onResult={report}
          />
        ))}
      </ul>
      <CartSummary
        totalItems={totalItems}
        subtotal={subtotal}
        currency={currency}
      />
    </div>
  )
}
