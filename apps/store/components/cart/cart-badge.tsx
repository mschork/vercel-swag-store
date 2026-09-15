import Link from 'next/link'
import { loadCart } from '@/lib/cart/get-cart'
import { CartIcon } from './cart-icon'

/**
 * Header cart link with the live count. It reads the cart cookie, so inside
 * E03's Suspense boundary it is the shell's only dynamic hole. No cart or an
 * expired one shows no count. A failed cart call shows the icon without a
 * count as well, the same as while loading: a zero would claim something
 * about a cart that could not be read (specs/callout.md).
 */
export async function CartBadge() {
  const result = await loadCart('Cart badge')
  const count = result ? (result.cart?.totalItems ?? 0) : null
  return (
    <Link
      href="/cart"
      className="inline-flex rounded-full hover:bg-bg-secondary"
    >
      <CartIcon count={count} />
    </Link>
  )
}
