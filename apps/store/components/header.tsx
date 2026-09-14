import { Suspense } from 'react'
import { CartBadge } from './cart/cart-badge'
import { CartIcon } from './cart/cart-icon'
import { Logo } from './logo'
import { NavLink } from './nav-link'

export function Header() {
  return (
    <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:h-16 sm:px-6">
      <div className="flex items-center gap-6 sm:gap-8">
        <Logo />
        <nav aria-label="Main">
          <ul className="flex items-center gap-4 text-sm sm:gap-6">
            <li>
              <NavLink href="/">Home</NavLink>
            </li>
            <li>
              <NavLink href="/search">Search</NavLink>
            </li>
          </ul>
        </nav>
      </div>
      <Suspense fallback={<CartIcon count={null} />}>
        <CartBadge />
      </Suspense>
    </header>
  )
}
