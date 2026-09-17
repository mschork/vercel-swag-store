'use client'

import { useEffect, useOptimistic, useState } from 'react'
import { useCartCount } from '@/components/cart/cart-count'
import {
  applyDrafts,
  applyLineChange,
  cartTotals,
  setDraft,
  type Drafts,
  type Line,
} from '@/lib/cart/lines'
import { CartLine } from './cart-line'
import { CartSummary } from './cart-summary'
import { EmptyCart } from './empty-cart'

/**
 * The cart page's client leaf. Lines live in `useOptimistic`, so a quantity
 * change or a removal shows at once and the totals follow. The server's answer
 * arrives through `refresh()` in the same round trip and replaces `lines`; a
 * failed change reverts on its own when its transition ends. Above them sit
 * drafts: quantities a row shows during its pause before saving, so rapid
 * clicks move the row and the totals before any request starts. While the
 * view is open the header badge shows its total, so the two never disagree.
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
  const [drafts, setDrafts] = useState<Drafts>({})
  const { setCartPage } = useCartCount()

  const draft = (productId: string, quantity: number | null, onlyIf?: number) =>
    setDrafts((current) => setDraft(current, productId, quantity, onlyIf))

  const report = (productId: string, error: string | null) =>
    setErrors((current) => {
      if (error !== null) return { ...current, [productId]: error }
      if (!(productId in current)) return current
      const next = { ...current }
      delete next[productId]
      return next
    })

  const shownLines = applyDrafts(optimisticLines, drafts)
  const { totalItems, subtotal } = cartTotals(shownLines)

  useEffect(() => {
    setCartPage(totalItems)
  }, [totalItems, setCartPage])
  useEffect(() => () => setCartPage(null), [setCartPage])

  if (shownLines.length === 0) return <EmptyCart />

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start lg:grid-cols-[minmax(0,1fr)_20rem]">
      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {shownLines.map((line) => (
          <CartLine
            key={line.productId}
            line={line}
            currency={currency}
            error={errors[line.productId] ?? null}
            onChange={applyChange}
            onDraft={draft}
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
