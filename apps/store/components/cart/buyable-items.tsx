'use client'

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useCart } from '@/components/cart/cart-provider'
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
 *
 * A card that leaves while it has focus hands focus to the next card in the
 * row, or the one before it, or the page's heading when none is left.
 */
export function BuyableItems({
  items,
  limit,
}: {
  items: readonly { productId: string; node: ReactNode }[]
  limit: number
}) {
  const { draw } = useVisit()
  const inCart = useCart().quantity
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
    // Every rect is read before any animation starts: a read after an
    // animation has begun forces the layout again.
    const moves = [...nodes.current].flatMap(([id, node]) => {
      const from = rects.get(id)
      return from ? [{ node, from, to: node.getBoundingClientRect() }] : []
    })
    for (const { node, from, to } of moves) {
      const dx = from.left - to.left
      const dy = from.top - to.top
      if (dx === 0 && dy === 0) continue
      node.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: SLIDE_MS, easing: 'ease-out' },
      )
    }
  }, [view.shown])

  // The card that last took focus; kept when focus is lost because the card
  // went inert or left, which gives no other element focus.
  const focused = useRef<string | null>(null)
  const order = useRef(view.shown)
  useLayoutEffect(() => {
    const previous = order.current
    order.current = view.shown
    const id = focused.current
    if (!id || (view.shown.includes(id) && !view.leaving.includes(id))) return
    focused.current = null
    const active = document.activeElement
    if (active && active !== document.body && !nodes.current.get(id)?.contains(active)) return
    const at = view.shown.includes(id) ? view.shown : previous
    const index = at.indexOf(id)
    const rest = view.shown.filter((other) => other !== id && !view.leaving.includes(other))
    const next =
      at.slice(index + 1).find((other) => rest.includes(other)) ??
      at.slice(0, index).reverse().find((other) => rest.includes(other))
    const target = next
      ? nodes.current.get(next)?.querySelector('button')
      : document.querySelector<HTMLElement>('main h1')
    if (!target) return
    if (!next) target.tabIndex = -1
    target.focus()
  })

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
        onFocus={() => {
          focused.current = productId
        }}
        onBlur={(event) => {
          if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) {
            focused.current = null
          }
        }}
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
