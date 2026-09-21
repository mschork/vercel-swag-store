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
import { useHydrated } from '@/lib/use-hydrated'
import { openVisit, resetVisit, type HandBack } from '@/lib/visit/open'
import { OPENING_DRAW_MARKER, OPENING_DRAW_WAIT_MS } from '@/lib/visit/opening-limits'

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
  /**
   * Records what the server saw. A seed with no visit never clears what the
   * client holds; it opens one, handing back the promotion that render showed.
   */
  seed: (value: SeededVisit | null, openingPromotion?: Promotion) => void
  /**
   * The stock hole reporting its opening draw, or `undefined` when it has
   * none. A draw reported after the open call has left is not kept, and the
   * caller must not paint it (specs/E21-first-visit.md).
   */
  reportOpeningDraw: (productId: string, count: number | undefined) => void
  /** A product's opening draw, when the open call carries it. */
  openingDraw: (productId: string) => number | undefined
  /**
   * The open call that has not landed yet, or `null`. An add waits for it,
   * because the action would otherwise open a visit of its own and the two
   * cookies would race.
   */
  pendingOpen: () => Promise<void> | null
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
  // What the open call hands back; `kept` repeats the draw as state for the
  // render to read. `pending` is the open call until it lands, and `release`
  // ends the wait for the stock hole's report.
  const handBack = useRef<HandBack>({})
  const [kept, setKept] = useState<Record<string, number>>({})
  const pending = useRef<Promise<void> | null>(null)
  const release = useRef<() => void>(() => {})

  const apply = useCallback((opened: SeededVisit | null) => {
    if (!opened) return
    setStock(opened.stock)
    setPromotion(opened.promotion)
    if (opened.lines) setLines(opened.lines)
  }, [])

  const open = useCallback((after: Promise<void> = Promise.resolve()) => {
    const call = after
      .then(async () => {
        if (opening.current) return
        opening.current = true
        const opened = await openVisit(handBack.current)
        if (!opened) return
        setStock(opened.stock)
        setPromotion(opened.promotion)
      })
      .finally(() => {
        if (pending.current === call) pending.current = null
      })
    pending.current = call
    return call
  }, [])

  const seed = useCallback(
    (value: SeededVisit | null, openingPromotion?: Promotion) => {
      if (value) {
        apply(value)
        if (!value.complete) void open()
        return
      }
      if (opening.current || pending.current) return
      if (openingPromotion) handBack.current.promotion = openingPromotion
      // The marker is in the static HTML, so it is there before the stock hole
      // hydrates; the seed and the hole hydrate in no fixed order.
      const coming =
        !handBack.current.draw && document.querySelector(`[${OPENING_DRAW_MARKER}]`) !== null
      if (!coming) {
        void open()
        return
      }
      void open(
        new Promise((resolve) => {
          release.current = resolve
          setTimeout(resolve, OPENING_DRAW_WAIT_MS)
        }),
      )
    },
    [apply, open],
  )

  const reportOpeningDraw = useCallback((productId: string, count: number | undefined) => {
    if (opening.current) return
    if (count !== undefined) {
      handBack.current.draw = { productId, count }
      setKept((current) =>
        current[productId] === count ? current : { ...current, [productId]: count },
      )
    }
    release.current()
  }, [])

  const reset = useCallback(async () => {
    if (!(await resetVisit())) return
    setStock(undefined)
    setPromotion(undefined)
    opening.current = false
    handBack.current = {}
    setKept({})
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
      reportOpeningDraw,
      openingDraw: (productId) => kept[productId],
      pendingOpen: () => pending.current,
      confirmLine,
      setAdding,
      reset,
    }),
    [stock, lines, adding, promotion, kept, seed, reportOpeningDraw, confirmLine, setAdding, reset],
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
 * of its own, so the first paint carries the real number. It is also used
 * while hydrating: a boundary that streams in late can find the provider
 * already holding a first visit's draws, which the server's HTML never saw.
 *
 * With `opening`, `serverDraw` is an opening draw, and after hydration it
 * counts only once the provider has kept it for the open call.
 */
export function useProductStock(
  productId: string,
  serverDraw?: number | null,
  opening = false,
): { draw: number | null | undefined; inCart: number } {
  const { draw, inCart, openingDraw } = useVisit()
  const hydrated = useHydrated()
  const held = hydrated ? draw(productId) : undefined
  const shown = opening && hydrated ? openingDraw(productId) : serverDraw
  return { draw: held === undefined ? shown : held, inCart: inCart(productId) }
}

/**
 * Hands the server's view of the cookie to the provider. A client leaf rather
 * than a call in the seed itself, because the provider is client state.
 */
export function VisitSeedClient({
  value,
  openingPromotion,
}: {
  value: SeededVisit | null
  /** The promotion this render showed a visitor without a visit. */
  openingPromotion?: Promotion
}) {
  const { seed } = useVisit()
  useEffect(() => {
    seed(value, openingPromotion)
  }, [value, openingPromotion, seed])
  return null
}
