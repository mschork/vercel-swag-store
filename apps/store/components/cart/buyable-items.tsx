'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useVisit } from '@/components/visit/visit-provider'
import { useHydrated } from '@/lib/use-hydrated'
import { cn } from '@/lib/utils'

/** How long an added product's card takes to fade before the row closes up. */
const FADE_MS = 200
/** How long the other cards take to slide into the space it leaves. */
const SLIDE_MS = 250

interface RowView {
  /** The product ids rendered, in rank order; a leaving card is still here. */
  shown: readonly string[]
  leaving: readonly string[]
  /** Cards that join as the row closes up; they fade in once it has. */
  entering: readonly string[]
  /** The ids the row wanted when `shown` was last settled. */
  wanted: string
  visitKnown: boolean
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Grid items for products the visitor can buy: the first `limit` whose product
 * is not in the cart, counting an add in flight, and not drawn at zero. The
 * items are rendered on the server in rank order, so the row can sit in the
 * static shell. While hydrating it repeats the server's first `limit`, because
 * the server does not know the visitor; the row then settles once the visit
 * arrives, at once.
 *
 * A product added from the row fades out, then the row closes up: the other
 * cards slide into its place, then the next one fades in at the end. The cards
 * are measured before and after, and each is moved from where it was.
 */
export function BuyableItems({
  items,
  limit,
}: {
  items: readonly { productId: string; node: ReactNode }[]
  limit: number
}) {
  const { inCart, draw } = useVisit()
  const hydrated = useHydrated()
  const buyable = hydrated
    ? items.filter(({ productId }) => inCart(productId) === 0 && draw(productId) !== 0)
    : items
  const wanted = buyable.slice(0, limit).map(({ productId }) => productId)
  const wantedKey = wanted.join(' ')
  const visitKnown = hydrated && items.some(({ productId }) => draw(productId) !== undefined)

  const [view, setView] = useState<RowView>(() => ({
    shown: wanted,
    leaving: [],
    entering: [],
    wanted: wantedKey,
    visitKnown,
  }))
  // Adjusting state when the wanted row changes, during render rather than in
  // an effect, so a change that is not animated shows in the same paint.
  if (view.wanted !== wantedKey || view.visitKnown !== visitKnown) {
    const added = view.shown.filter((id) => !wanted.includes(id) && inCart(id) > 0)
    const animate = view.visitKnown && visitKnown && added.length > 0 && !reducedMotion()
    setView(
      animate
        ? { ...view, leaving: view.shown.filter((id) => !wanted.includes(id)), wanted: wantedKey }
        : { shown: wanted, leaving: [], entering: [], wanted: wantedKey, visitKnown },
    )
  }

  const nodes = useRef(new Map<string, HTMLLIElement>())
  const before = useRef(new Map<string, DOMRect>())
  const latest = useRef(wanted)
  useEffect(() => {
    latest.current = wanted
  })

  // Once the fade ends, the row closes up: every card's place is recorded
  // first, so the layout effect below can slide it from there.
  useEffect(() => {
    if (view.leaving.length === 0) return
    const timer = setTimeout(() => {
      before.current = new Map(
        [...nodes.current].map(([id, node]) => [id, node.getBoundingClientRect()]),
      )
      setView((current) => ({
        shown: latest.current,
        leaving: [],
        entering: latest.current.filter((id) => !current.shown.includes(id)),
        wanted: latest.current.join(' '),
        visitKnown: current.visitKnown,
      }))
    }, FADE_MS)
    return () => clearTimeout(timer)
  }, [view.leaving])

  useLayoutEffect(() => {
    const rects = before.current
    if (rects.size === 0) return
    before.current = new Map()
    for (const [id, node] of nodes.current) {
      const from = rects.get(id)
      if (!from) continue
      const to = node.getBoundingClientRect()
      const dx = from.left - to.left
      const dy = from.top - to.top
      if (dx === 0 && dy === 0) continue
      node.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: SLIDE_MS, easing: 'ease-out' },
      )
    }
  }, [view.shown])

  const byId = new Map(items.map((item) => [item.productId, item.node]))
  return view.shown.map((productId) => {
    const leaving = view.leaving.includes(productId)
    const entering = view.entering.includes(productId)
    return (
      <li
        key={productId}
        ref={(node) => {
          if (node) nodes.current.set(productId, node)
          else nodes.current.delete(productId)
        }}
        inert={leaving}
        className={cn(
          leaving && 'opacity-0 transition-opacity ease-out',
          entering && 'animate-fade-in',
        )}
        style={
          leaving
            ? { transitionDuration: `${FADE_MS}ms` }
            : entering
              ? { animationDelay: `${SLIDE_MS}ms` }
              : undefined
        }
      >
        {byId.get(productId)}
      </li>
    )
  })
}
