import { headers } from 'next/headers'
import Link from 'next/link'
import { loadCart } from '@/lib/cart/get-cart'
import { CartCount } from './cart-count'

/**
 * Header cart link with the live count. It reads the cart cookie, so inside
 * E03's Suspense boundary it is the shell's only dynamic hole. No cart or an
 * expired one shows no count. A failed cart call shows the icon without a
 * count as well, the same as while loading: a zero would claim something
 * about a cart that could not be read (specs/callout.md).
 *
 * The number itself is client-held. Every cart action answers with the new
 * count, and setting the cart cookie makes Next re-render the page inside the
 * action's response, so on that render the badge skips its read: the answer
 * would otherwise wait about 1.7 s for a count the client already has.
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
