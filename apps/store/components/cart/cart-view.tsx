'use client'

import { useEffect, useOptimistic, useRef, useState } from 'react'
import { useCartCountActions } from '@/components/cart/cart-count'
import { useVisit } from '@/components/visit/visit-provider'
import {
  dismissFailure,
  dismissFailures,
  holdLines,
  publishLines,
  useAddsInFlight,
  withPending,
  type FailedAdd,
} from '@/lib/cart/adds-in-flight'
import {
  applyDrafts,
  applyLineChange,
  cartTotals,
  setDraft,
  type Drafts,
  type Line,
  type LineChange,
} from '@/lib/cart/lines'
import { useHydrated } from '@/lib/use-hydrated'
import { allows } from '@/lib/visit/remaining'
import { cn } from '@/lib/utils'
import { CartLine } from './cart-line'
import { CartSummary } from './cart-summary'
import { EMPTY_CART_HEADING, EmptyCart } from './empty-cart'

/**
 * The cart page's client leaf. Lines live in `useOptimistic`, so a quantity
 * change or a removal shows at once and the totals follow. Under them are the
 * saved lines: the server's `lines`, replaced by a newer answer from any cart
 * action, a row's or an add's (`holdLines`). Above them sit drafts: the
 * quantities a row shows during its pause before saving. Above those, the
 * pending lines of adds still saving, as rows that say so. Messages are kept
 * here, keyed by product, because a row removed optimistically unmounts and
 * has to show why if the removal fails. An add that failed and left its
 * product without a row is listed at the top until the visitor changes that
 * product's line, adds again or leaves the page.
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
  const inFlight = useAddsInFlight()
  const [held, setHeld] = useState(() => holdLines(null, lines, inFlight))
  const current = holdLines(held, lines, inFlight)
  if (current !== held) setHeld(current)
  const [optimisticLines, applyChange] = useOptimistic(current.lines, applyLineChange)
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({})
  const [drafts, setDrafts] = useState<Drafts>({})
  const [removed, setRemoved] = useState('')
  const list = useRef<HTMLUListElement>(null)
  // The row a removal took and where it stood, until focus has moved on.
  const leaving = useRef<{ productId: string; index: number } | null>(null)
  const { setCartPage } = useCartCountActions()
  const hydrated = useHydrated()

  const draft = (productId: string, quantity: number | null, onlyIf?: number) =>
    setDrafts((existing) => setDraft(existing, productId, quantity, onlyIf))

  const report = (productId: string, error: string | null) => {
    dismissFailure(productId)
    setErrors((existing) => {
      if (error !== null) return { ...existing, [productId]: error }
      if (!(productId in existing)) return existing
      const next = { ...existing }
      delete next[productId]
      return next
    })
  }
  const change = (lineChange: LineChange) => {
    dismissFailure(lineChange.productId)
    applyChange(lineChange)
  }

  const shownLines = withPending(applyDrafts(optimisticLines, drafts), inFlight.pending)
  const { totalItems, subtotal } = cartTotals(shownLines)
  const saving = shownLines.some((line) => line.pending)
  const drawOf = (productId: string) =>
    (hydrated ? heldDraw(productId) : undefined) ?? serverDraws[productId] ?? null
  // A product that still has a row shows its quantity there, not a failure.
  const failures = inFlight.failures.filter(
    (failure) => !shownLines.some((line) => line.productId === failure.productId),
  )
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

  useEffect(() => {
    setCartPage(totalItems)
  }, [totalItems, setCartPage])
  useEffect(
    () => () => {
      setCartPage(null)
      dismissFailures()
    },
    [setCartPage],
  )

  return (
    <>
      <FailedAdds failures={failures} />
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
                pending={line.pending}
                priority={index === 0}
                error={errors[line.productId] ?? null}
                onChange={change}
                onDraft={draft}
                onSaved={publishLines}
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
function FailedAdds({ failures }: { failures: readonly FailedAdd[] }) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col text-sm leading-6 text-danger',
        failures.length === 0 && 'sr-only',
      )}
    >
      {failures.map((failure) => (
        <p key={failure.productId}>
          {failure.name}: {failure.error}
        </p>
      ))}
    </div>
  )
}
