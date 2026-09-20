'use client'

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Promotion } from '@/lib/api/types'
import { openVisit, resetVisit } from '@/lib/visit/open'

/** What the server read from the visit cookie, or `null` when there was none. */
export interface SeededVisit {
  stock: Record<string, number>
  promotion: Promotion | null
  /**
   * Whether the visit already covers the catalogue and holds a promotion.
   * When it does not, the client tops it up; the handler keeps the counts
   * that are already there, so nothing the visitor has seen changes.
   */
  complete: boolean
  /**
   * Quantities in the visitor's cart, keyed by product id. Absent when the
   * seed did not read the cart, which is what happens inside an action's
   * response; the lines the client holds are left alone.
   */
  lines?: Record<string, number>
}

interface VisitApi {
  /** A product's stock draw: `undefined` before the visit arrives, `null` when it has no count. */
  draw: (productId: string) => number | null | undefined
  /** How many of a product the cart holds, counting an add in flight. */
  inCart: (productId: string) => number
  promotion: Promotion | null | undefined
  /** Records what the server saw. A seed with no visit never clears what the client holds. */
  seed: (value: SeededVisit | null) => void
  /** Records a cart line an action just wrote. */
  confirmLine: (productId: string, quantity: number) => void
  /** Items of the add in flight for a product; 0 when none is. */
  setAdding: (productId: string, quantity: number) => void
  /** Drops the visit and draws a new one. */
  reset: () => Promise<void>
}

const VisitContext = createContext<VisitApi | null>(null)

/**
 * Holds the visitor's stock draws and pinned promotion on the client, so every
 * grid badge and stock line reads one number without a request of its own.
 *
 * It wraps the layout and is the client's source of truth, because the seed
 * that fills it runs only on a full load and on `refresh()`: a client-side
 * navigation keeps the root layout, so the seed does not run again.
 */
export function VisitProvider({ children }: { children: ReactNode }) {
  const [stock, setStock] = useState<Record<string, number> | undefined>(undefined)
  const [promotion, setPromotion] = useState<Promotion | null | undefined>(undefined)
  const [lines, setLines] = useState<Record<string, number>>({})
  const [adding, setAddingState] = useState<Record<string, number>>({})
  // Opening is a one-off per page load, and a ref keeps it out of the render
  // cycle: a state flag here would be a setState inside an effect.
  const opening = useRef(false)

  const apply = useCallback((opened: SeededVisit | null) => {
    if (!opened) return
    setStock(opened.stock)
    setPromotion(opened.promotion)
    if (opened.lines) setLines(opened.lines)
  }, [])

  const open = useCallback(async () => {
    if (opening.current) return
    opening.current = true
    const opened = await openVisit()
    if (opened) {
      setStock(opened.stock)
      setPromotion(opened.promotion)
    }
  }, [])

  const seed = useCallback(
    (value: SeededVisit | null) => {
      if (!value) {
        void open()
        return
      }
      apply(value)
      if (!value.complete) void open()
    },
    [apply, open],
  )

  const reset = useCallback(async () => {
    if (!(await resetVisit())) return
    setStock(undefined)
    setPromotion(undefined)
    opening.current = false
    await open()
  }, [open])

  // Both keep their identity across renders and ignore a write that changes
  // nothing, because the Add to Cart form calls them from an effect: a new
  // object every time would re-run it and never settle.
  const confirmLine = useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      current[productId] === quantity ? current : { ...current, [productId]: quantity },
    )
  }, [])

  const setAdding = useCallback((productId: string, quantity: number) => {
    setAddingState((current) =>
      (current[productId] ?? 0) === quantity ? current : { ...current, [productId]: quantity },
    )
  }, [])

  const value = useMemo<VisitApi>(
    () => ({
      draw: (productId) => (stock ? (stock[productId] ?? null) : undefined),
      inCart: (productId) => (lines[productId] ?? 0) + (adding[productId] ?? 0),
      promotion,
      seed,
      confirmLine,
      setAdding,
      reset,
    }),
    [stock, lines, adding, promotion, seed, confirmLine, setAdding, reset],
  )
  return <VisitContext value={value}>{children}</VisitContext>
}

export function useVisit(): VisitApi {
  const api = use(VisitContext)
  if (!api) throw new Error('useVisit needs a VisitProvider')
  return api
}

/**
 * A product's draw and the quantity of it in the cart. `serverDraw` is what
 * the server read in this render, and is used until the provider has a visit
 * of its own, so the first paint carries the real number.
 */
export function useProductStock(
  productId: string,
  serverDraw?: number | null,
): { draw: number | null | undefined; inCart: number } {
  const { draw, inCart } = useVisit()
  const held = draw(productId)
  return { draw: held === undefined ? serverDraw : held, inCart: inCart(productId) }
}

/**
 * Hands the server's view of the cookie to the provider. A client leaf rather
 * than a call in the seed itself, because the provider is client state.
 */
export function VisitSeedClient({ value }: { value: SeededVisit | null }) {
  const { seed } = useVisit()
  useEffect(() => {
    seed(value)
  }, [value, seed])
  return null
}
