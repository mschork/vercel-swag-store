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
  /** Items of the Add to Cart in flight; 0 when none is. */
  setAdding: (quantity: number) => void
  /** The open cart page's total, or `null` when it closes. */
  setCartPage: (count: number | null) => void
}

const CartCountContext = createContext<CartCountApi | null>(null)

/**
 * Holds the header badge's count on the client, so an action can update it
 * from the count it returns instead of waiting for the badge to read the cart
 * again. It wraps the layout and keeps no data of its own: the server seeds
 * it through the badge, and actions confirm it.
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
 * The badge's number. `serverCount` is what the badge read in this render,
 * or `undefined` when it did not read (inside an action's response). The
 * confirmed count is whichever arrived last: a count read here, or a count an
 * action returned.
 */
export function CartCount({
  serverCount,
}: {
  serverCount: number | null | undefined
}) {
  const { confirmed, adding, cartPage, confirm } = useCartCount()
  useEffect(() => {
    if (serverCount !== undefined) confirm(serverCount)
  }, [serverCount, confirm])
  return (
    <CartIcon
      count={shownCount({ server: serverCount, confirmed, adding, cartPage })}
    />
  )
}
