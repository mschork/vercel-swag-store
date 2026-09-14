import Link from 'next/link'
import { CartIcon } from './cart-icon'

/**
 * Header cart link. Static in E03: no cart exists yet, so there is no count.
 * E06 replaces this with an async component that reads the cart cookie, which
 * turns the Suspense boundary around it into the shell's only dynamic hole.
 */
export function CartBadge() {
  return (
    <Link href="/cart" className="inline-flex rounded-full hover:bg-bg-secondary">
      <CartIcon count={null} />
    </Link>
  )
}
