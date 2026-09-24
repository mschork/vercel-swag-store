'use client'

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Promotion } from '@/lib/api/types'
import { useHydrated } from '@/lib/use-hydrated'
import { resetVisit } from '@/lib/visit/open'

/** What the server read from the session: the visit and the cart's quantities by product id. */
export interface SeededVisit {
  stock: Record<string, number>
  promotion: Promotion | null
  lines: Record<string, number>
}

interface VisitApi {
  /** A product's stock draw: `undefined` before the visit arrives, `null` when it has no count. */
  draw: (productId: string) => number | null | undefined
  /** How many of a product the cart holds, counting an add in flight. */
  inCart: (productId: string) => number
  promotion: Promotion | null | undefined
  /**
   * Records what the server read. `null` is a session the store could not
   * read, and leaves what the client holds.
   */
  seed: (value: SeededVisit | null) => void
  /** Records a cart line an action just wrote. */
  confirmLine: (productId: string, quantity: number) => void
  /** Items of the adds in flight for a product; 0 when none is. */
  setAdding: (productId: string, quantity: number) => void
  /** Drops the visit and holds the one drawn in its place. */
  reset: () => Promise<void>
}

const VisitContext = createContext<VisitApi | null>(null)

/**
 * Holds the visitor's stock draws and pinned promotion on the client, so every
 * grid badge and stock line reads one number without a request of its own.
 *
 * It wraps the layout and is the client's source of truth, because the seed
 * that fills it runs only on a full load and on `router.refresh()`: a
 * client-side navigation keeps the root layout, so the seed does not run
 * again.
 */
export function VisitProvider({ children }: { children: ReactNode }) {
  const [stock, setStock] = useState<Record<string, number> | undefined>(undefined)
  const [promotion, setPromotion] = useState<Promotion | null | undefined>(undefined)
  const [lines, setLines] = useState<Record<string, number>>({})
  const [adding, setAddingState] = useState<Record<string, number>>({})

  const seed = useCallback((value: SeededVisit | null) => {
    if (!value) return
    setStock(value.stock)
    setPromotion(value.promotion)
    setLines(value.lines)
  }, [])

  const reset = useCallback(async () => {
    const drawn = await resetVisit()
    if (!drawn) return
    setStock(drawn.stock)
    setPromotion(drawn.promotion)
  }, [])

  // Both keep their identity across renders and ignore a write that changes
  // nothing, because an Add to Cart form applies an answer from an effect: a
  // new object every time would re-run it and never settle.
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
 * the server read in this render, and is used until the provider holds a
 * visit, and while hydrating, so the first client render repeats the
 * server's HTML.
 */
export function useProductStock(
  productId: string,
  serverDraw?: number | null,
): { draw: number | null | undefined; inCart: number } {
  const { draw, inCart } = useVisit()
  const hydrated = useHydrated()
  const held = hydrated ? draw(productId) : undefined
  return { draw: held === undefined ? serverDraw : held, inCart: inCart(productId) }
}

/**
 * Hands the server's read of the session to the provider. A client leaf
 * rather than a call in the seed itself, because the provider is client
 * state.
 */
export function VisitSeedClient({ value }: { value: SeededVisit | null }) {
  const { seed } = useVisit()
  useEffect(() => {
    seed(value)
  }, [value, seed])
  return null
}
