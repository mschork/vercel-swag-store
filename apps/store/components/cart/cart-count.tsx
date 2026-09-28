'use client'

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { shownCount } from '@/lib/cart/count'
import { useHydrated } from '@/lib/use-hydrated'
import { CartIcon } from './cart-icon'

type CartCountState = {
  confirmed: number | null | undefined
  adding: number
  cartPage: number | null
}

type CartCountActions = {
  /** Records the count the API last reported. */
  confirm: (count: number | null) => void
  /** Items of every add in flight; 0 when none is. */
  setAdding: (quantity: number) => void
  /** The open cart page's total, or `null` when it closes. */
  setCartPage: (count: number | null) => void
}

const CartCountContext = createContext<CartCountState | null>(null)
const CartCountActionsContext = createContext<CartCountActions | null>(null)

/**
 * Holds the header badge's count on the client, so an action can update it
 * from the count it answers with: no action re-renders the badge. It wraps
 * the layout and keeps no data of its own: the server seeds it through the
 * badge, and actions confirm it. The setters sit in a context of their own,
 * which never changes, so a component that only writes the count does not
 * render when it changes.
 */
export function CartCountProvider({ children }: { children: ReactNode }) {
  const [confirmed, confirm] = useState<number | null | undefined>(undefined)
  const [adding, setAdding] = useState(0)
  const [cartPage, setCartPage] = useState<number | null>(null)
  const state = useMemo(() => ({ confirmed, adding, cartPage }), [confirmed, adding, cartPage])
  const actions = useMemo(() => ({ confirm, setAdding, setCartPage }), [])
  return (
    <CartCountActionsContext value={actions}>
      <CartCountContext value={state}>{children}</CartCountContext>
    </CartCountActionsContext>
  )
}

export function useCartCount(): CartCountState {
  const state = use(CartCountContext)
  if (!state) throw new Error('useCartCount needs a CartCountProvider')
  return state
}

export function useCartCountActions(): CartCountActions {
  const actions = use(CartCountActionsContext)
  if (!actions) throw new Error('useCartCountActions needs a CartCountProvider')
  return actions
}

/**
 * The badge's number. `serverRead.count` is what the badge read from the cart
 * mirror in this render, `null` when the session store could not be read.
 * The confirmed count is whichever arrived last: a count read here, or a
 * count an action returned. Each server render sends a new `serverRead`, so a
 * read that repeats the last count still replaces one an action set since, as
 * when an order empties a cart that was empty when the page loaded.
 */
export function CartCount({ serverRead }: { serverRead: { count: number | null } }) {
  const { confirmed, adding, cartPage } = useCartCount()
  const { confirm } = useCartCountActions()
  const serverCount = serverRead.count
  useEffect(() => {
    confirm(serverRead.count)
  }, [serverRead, confirm])
  const count = shownCount({ server: serverCount, confirmed, adding, cartPage })
  return (
    <>
      <CartIcon count={count} />
      <CountStatus count={count} />
    </>
  )
}

/**
 * Says the badge's new count to screen readers when it changes, never on the
 * first render. A portal to the end of the body, because inside the header
 * link the status would join the link's name.
 */
function CountStatus({ count }: { count: number | null }) {
  const hydrated = useHydrated()
  const [said, setSaid] = useState({ count, text: '' })
  if (said.count !== count) {
    const text = count === null ? '' : `${count} ${count === 1 ? 'item' : 'items'} in your cart`
    setSaid({ count, text })
  }
  if (!hydrated) return null
  return createPortal(
    <p role="status" className="sr-only">
      {said.text}
    </p>,
    document.body,
  )
}
