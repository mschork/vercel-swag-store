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
import { useChangesInFlight } from '@/lib/cart/changes-in-flight'
import { quantitiesOf, type LineChange } from '@/lib/cart/lines'
import { useHydrated } from '@/lib/use-hydrated'
import { resetVisit } from '@/lib/visit/open'

/** What the server read from the session: the visit and the cart's quantities by product id. */
export interface SeededVisit {
  stock: Record<string, number>
  lines: Record<string, number>
}

interface VisitState {
  /** A product's stock draw: `undefined` before the visit arrives, `null` when it has no count. */
  draw: (productId: string) => number | null | undefined
  /** How many of a product the cart holds, counting a change or an add in flight. */
  inCart: (productId: string) => number
}

interface VisitActions {
  /**
   * Records what the server read. `null` is a session the store could not
   * read, and leaves what the client holds.
   */
  seed: (value: SeededVisit | null) => void
  /** Records the whole cart as an action's answer reported it. */
  confirmCart: (lines: readonly LineChange[]) => void
  /** Items of the adds in flight for a product; 0 when none is. */
  setAdding: (productId: string, quantity: number) => void
  /** Drops the visit and holds the one drawn in its place. */
  reset: () => Promise<void>
}

const VisitContext = createContext<VisitState | null>(null)
const VisitActionsContext = createContext<VisitActions | null>(null)

/**
 * Holds the visitor's stock draws on the client, so every grid badge and
 * stock line reads one number without a request of its own.
 *
 * It wraps the layout and is the client's source of truth, because the seed
 * that fills it runs only on a full load and on `router.refresh()`: a
 * client-side navigation keeps the root layout, so the seed does not run
 * again. The actions sit in a context of their own, which never changes, so
 * a component that only writes does not render when a draw or a line does.
 */
export function VisitProvider({ children }: { children: ReactNode }) {
  const [stock, setStock] = useState<Record<string, number> | undefined>(undefined)
  const [lines, setLines] = useState<Record<string, number>>({})
  const [adding, setAddingState] = useState<Record<string, number>>({})
  const changing = useChangesInFlight()

  const seed = useCallback((value: SeededVisit | null) => {
    if (!value) return
    setStock(value.stock)
    setLines(value.lines)
  }, [])

  const reset = useCallback(async () => {
    const drawn = await resetVisit()
    if (!drawn) return
    setStock(drawn.stock)
  }, [])

  // Both keep their identity across renders and ignore a write that changes
  // nothing, because an Add to Cart form applies an answer from an effect: a
  // new object every time would re-run it and never settle.
  const confirmCart = useCallback((answered: readonly LineChange[]) => {
    setLines((current) => quantitiesOf(current, answered))
  }, [])

  const setAdding = useCallback((productId: string, quantity: number) => {
    setAddingState((current) =>
      (current[productId] ?? 0) === quantity ? current : { ...current, [productId]: quantity },
    )
  }, [])

  const state = useMemo<VisitState>(
    () => ({
      draw: (productId) => (stock ? (stock[productId] ?? null) : undefined),
      inCart: (productId) =>
        (changing[productId] ?? lines[productId] ?? 0) + (adding[productId] ?? 0),
    }),
    [stock, lines, adding, changing],
  )
  const actions = useMemo<VisitActions>(
    () => ({ seed, confirmCart, setAdding, reset }),
    [seed, confirmCart, setAdding, reset],
  )
  return (
    <VisitActionsContext value={actions}>
      <VisitContext value={state}>{children}</VisitContext>
    </VisitActionsContext>
  )
}

export function useVisit(): VisitState {
  const state = use(VisitContext)
  if (!state) throw new Error('useVisit needs a VisitProvider')
  return state
}

export function useVisitActions(): VisitActions {
  const actions = use(VisitActionsContext)
  if (!actions) throw new Error('useVisitActions needs a VisitProvider')
  return actions
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
  // Subscribed here as well as in the provider, so a page shown again after
  // being hidden renders a change saved meanwhile at once
  // (`lib/cart/changes-in-flight.ts`).
  useChangesInFlight()
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
  const { seed } = useVisitActions()
  useEffect(() => {
    seed(value)
  }, [value, seed])
  return null
}
