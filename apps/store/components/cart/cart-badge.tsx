import { headers } from 'next/headers'
import Link from 'next/link'
import { loadCart } from '@/lib/cart/get-cart'
import { CartCount } from './cart-count'

/**
 * Header cart link with the live count. It reads the cart cookie, so inside
 * its Suspense boundary it is the shell's only dynamic hole. A missing,
 * expired or unreadable cart shows the icon alone, the same as while loading:
 * a zero would claim something about a cart the store could not read.
 *
 * The number itself is client-held. Every cart action answers with the new
 * count, and setting the cart cookie makes Next re-render the page inside the
 * action's response, so on that render the badge skips its read: the cart API
 * is slow (`lib/api/cart.ts`) and the client already has the count.
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
