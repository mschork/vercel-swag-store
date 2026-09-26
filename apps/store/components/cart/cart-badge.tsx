import Link from 'next/link'
import { loadCart } from '@/lib/cart/get-cart'
import { CartCount } from './cart-count'

/**
 * Header cart link with the count from the cart mirror, and the shell's only
 * dynamic hole inside its Suspense boundary. No cart counts as none; a
 * session the store could not read shows the icon alone, with no count.
 */
export async function CartBadge() {
  const cart = await loadCart()
  const count = cart === 'unavailable' ? null : (cart?.totalItems ?? 0)
  return (
    <Link
      href="/cart"
      className="inline-flex rounded-full hover:bg-bg-secondary"
    >
      <CartCount serverRead={{ count }} />
    </Link>
  )
}
