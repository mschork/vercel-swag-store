'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useHydrated } from '@/lib/use-hydrated'
import { CartIcon } from './cart-icon'
import { useCartCount } from './cart-provider'

/**
 * The badge's number. `serverRead.count` is what the badge read from the cart
 * mirror in this render, `null` when the session store could not be read; it
 * stands until the cart provider holds the session's lines.
 */
export function CartCount({ serverRead }: { serverRead: { count: number | null } }) {
  const count = useCartCount(serverRead.count)
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
