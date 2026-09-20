'use client'

import { useEffect, useOptimistic, useState } from 'react'
import { useCartCount } from '@/components/cart/cart-count'
import { useVisit } from '@/components/visit/visit-provider'
import {
  applyDrafts,
  applyLineChange,
  cartTotals,
  setDraft,
  type Drafts,
  type Line,
} from '@/lib/cart/lines'
import { exceedsDraw } from '@/lib/visit/limits'
import { CartLine } from './cart-line'
import { CartSummary } from './cart-summary'
import { EmptyCart } from './empty-cart'

/**
 * The cart page's client leaf. Lines live in `useOptimistic`, so a quantity
 * change or a removal shows at once and the totals follow; the server's answer
 * arrives through `refresh()` and replaces `lines`. Above them sit drafts: the
 * quantities a row shows during its pause before saving. Messages are kept
 * here, keyed by product, because a row removed optimistically unmounts and
 * has to show why if the removal fails.
 *
 * Each row's cap is the visitor's draw: what the provider holds, or what the
 * server read for `serverDraws` until it does. A row above its cap, which
 * happens when the visit was reset or redrawn while the cart lived on, says so
 * and keeps Checkout disabled until it is reduced or removed.
 */
export function CartView({
  lines,
  currency,
  serverDraws,
}: {
  lines: Line[]
  currency: string
  serverDraws: Readonly<Record<string, number | null>>
}) {
  const { draw: heldDraw } = useVisit()
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
  const drawOf = (productId: string) => heldDraw(productId) ?? serverDraws[productId] ?? null
  const overDrawn = shownLines.some((line) =>
    exceedsDraw(line.quantity, drawOf(line.productId)),
  )

  useEffect(() => {
    setCartPage(totalItems)
  }, [totalItems, setCartPage])
  useEffect(() => () => setCartPage(null), [setCartPage])

  if (shownLines.length === 0) return <EmptyCart />

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start lg:grid-cols-[minmax(0,1fr)_20rem]">
      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {shownLines.map((line, index) => (
          <CartLine
            key={line.productId}
            line={line}
            currency={currency}
            draw={drawOf(line.productId)}
            priority={index === 0}
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
        blocked={overDrawn}
      />
    </div>
  )
}
