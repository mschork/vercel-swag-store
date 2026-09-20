import { headers } from 'next/headers'
import Link from 'next/link'
import { loadCart } from '@/lib/cart/get-cart'
import { CartCount } from './cart-count'

/**
 * Header cart link with the live count, and the shell's only dynamic hole
 * inside its Suspense boundary. A missing, expired or unreadable cart shows
 * the icon alone, with no count. Inside an action's response the badge skips
 * its read: the cart API is slow (`lib/api/cart.ts`) and the client already
 * holds the count the action returned.
 */
export async function CartBadge() {
  const duringAction = (await headers()).has('next-action')
  const result = duringAction ? undefined : await loadCart('Cart badge')
  const count =
    result === undefined
      ? undefined
      : result
        ? (result.cart?.totalItems ?? 0)
        : null
  return (
    <Link
      href="/cart"
      className="inline-flex rounded-full hover:bg-bg-secondary"
    >
      <CartCount serverCount={count} />
    </Link>
  )
}
