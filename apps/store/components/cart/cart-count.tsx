'use client'

import {
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { shownCount } from '@/lib/cart/count'
import { CartIcon } from './cart-icon'

type CartCountApi = {
  confirmed: number | null | undefined
  adding: number
  cartPage: number | null
  /** Records the count the API last reported. */
  confirm: (count: number | null) => void
  /** Items of every add in flight; 0 when none is. */
  setAdding: (quantity: number) => void
  /** The open cart page's total, or `null` when it closes. */
  setCartPage: (count: number | null) => void
}

const CartCountContext = createContext<CartCountApi | null>(null)

/**
 * Holds the header badge's count on the client, so an action can update it
 * from the count it answers with: no action re-renders the badge. It wraps
 * the layout and keeps no data of its own: the server seeds it through the
 * badge, and actions confirm it.
 */
export function CartCountProvider({ children }: { children: ReactNode }) {
  const [confirmed, confirm] = useState<number | null | undefined>(undefined)
  const [adding, setAdding] = useState(0)
  const [cartPage, setCartPage] = useState<number | null>(null)
  const value = useMemo(
    () => ({ confirmed, adding, cartPage, confirm, setAdding, setCartPage }),
    [confirmed, adding, cartPage],
  )
  return <CartCountContext value={value}>{children}</CartCountContext>
}

export function useCartCount(): CartCountApi {
  const api = use(CartCountContext)
  if (!api) throw new Error('useCartCount needs a CartCountProvider')
  return api
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
  const { confirmed, adding, cartPage, confirm } = useCartCount()
  const serverCount = serverRead.count
  useEffect(() => {
    confirm(serverRead.count)
  }, [serverRead, confirm])
  return (
    <CartIcon
      count={shownCount({ server: serverCount, confirmed, adding, cartPage })}
    />
  )
}
