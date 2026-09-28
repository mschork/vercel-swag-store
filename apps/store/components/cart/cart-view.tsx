'use client'

import { useEffect, useRef, useState } from 'react'
import { useVisit } from '@/components/visit/visit-provider'
import { cartTotals, type Line, type ShownLine } from '@/lib/cart/lines'
import { useHydrated } from '@/lib/use-hydrated'
import { allows } from '@/lib/visit/remaining'
import { cn } from '@/lib/utils'
import { CartLine } from './cart-line'
import { useCart, useCartActions } from './cart-provider'
import { CartSummary } from './cart-summary'
import { EMPTY_CART_HEADING, EmptyCart } from './empty-cart'

/**
 * The cart page's client leaf. It shows the cart provider's lines, with every
 * write in flight and every unsaved quantity, and the server's `lines` until
 * the provider holds the session's and while hydrating. Messages are kept here, keyed by product,
 * because a row removed optimistically unmounts and has to show why if the
 * removal fails. The last failed add is said at the top.
 *
 * Each row's cap is the visitor's draw: what the provider holds, or what the
 * server read for `serverDraws` until it does. While hydrating it is always
 * `serverDraws`, so the first client render repeats the server's HTML. A row
 * above its cap, which happens when the visit was reset while the cart lived
 * on, or without a draw, says so and keeps Checkout disabled until it is
 * reduced or removed.
 *
 * A removal says so in a status line, and focus moves from the Remove button
 * that leaves with its row to the row that takes its place, or to the empty
 * cart's heading.
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
  const cart = useCart()
  const { dismissFailure } = useCartActions()
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({})
  const [removed, setRemoved] = useState('')
  const list = useRef<HTMLUListElement>(null)
  // The row a removal took and where it stood, until focus has moved on.
  const leaving = useRef<{ productId: string; index: number } | null>(null)
  const hydrated = useHydrated()

  const report = (productId: string, error: string | null) => {
    setErrors((existing) => {
      if (error !== null) return { ...existing, [productId]: error }
      if (!(productId in existing)) return existing
      const next = { ...existing }
      delete next[productId]
      return next
    })
  }

  const shownLines: ShownLine[] =
    (hydrated ? cart.lines : null) ??
    [...lines.map((line) => ({ ...line, pending: false, changing: false })), ...cart.unseeded]
  const { totalItems, subtotal } = cartTotals(shownLines)
  const saving = shownLines.some((line) => line.pending)
  const drawOf = (productId: string) =>
    (hydrated ? heldDraw(productId) : undefined) ?? serverDraws[productId] ?? null
  const blocked = shownLines.some((line) => !allows(drawOf(line.productId), line.quantity))

  const remove = (productId: string) => {
    const index = shownLines.findIndex((line) => line.productId === productId)
    leaving.current = { productId, index }
    setRemoved(`${shownLines[index]?.name ?? 'Product'} removed from your cart`)
  }
  // Every render, because the row leaves in whichever render the optimistic
  // removal lands in.
  useEffect(() => {
    const from = leaving.current
    if (!from || shownLines.some((line) => line.productId === from.productId)) return
    leaving.current = null
    const rows = list.current?.children
    const row = rows?.[Math.min(from.index, rows.length - 1)]
    const target = row?.querySelector('a') ?? document.getElementById(EMPTY_CART_HEADING)
    target?.focus()
  })

  useEffect(() => dismissFailure, [dismissFailure])

  return (
    <>
      <FailedAdd
        // A product that still has a row shows its quantity there, not a failure.
        failure={
          cart.failure && !shownLines.some((line) => line.productId === cart.failure?.productId)
            ? cart.failure.message
            : null
        }
      />
      <p role="status" className="sr-only">
        {removed}
      </p>
      {shownLines.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start lg:grid-cols-[minmax(0,1fr)_20rem]">
          <ul ref={list} className="flex flex-col divide-y divide-border border-y border-border">
            {shownLines.map((line, index) => (
              <CartLine
                key={line.productId}
                line={line}
                currency={currency}
                draw={drawOf(line.productId)}
                priority={index === 0}
                error={errors[line.productId] ?? null}
                onResult={report}
                onRemove={remove}
              />
            ))}
          </ul>
          <CartSummary
            totalItems={totalItems}
            subtotal={subtotal}
            currency={currency}
            blocked={blocked}
            saving={saving}
          />
        </div>
      )}
    </>
  )
}

/**
 * Why a saving row went. Always rendered, and out of the layout while empty,
 * so screen readers announce a message when one appears.
 */
function FailedAdd({ failure }: { failure: string | null }) {
  return (
    <p role="status" className={cn('text-sm leading-6 text-danger', !failure && 'sr-only')}>
      {failure}
    </p>
  )
}
