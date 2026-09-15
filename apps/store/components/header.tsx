import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'
import { CartBadge } from './cart/cart-badge'
import { CartIcon } from './cart/cart-icon'
import { Logo } from './logo'
import { NavLink } from './nav-link'

type NavItem = { href: '/' | '/search'; label: string }

const NAV: readonly NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Search' },
]

function NavList({ children }: { children: (item: NavItem) => ReactNode }) {
  return (
    <ul className="flex items-center gap-4 text-sm sm:gap-6">
      {NAV.map((item) => (
        <li key={item.href}>{children(item)}</li>
      ))}
    </ul>
  )
}

/**
 * The nav sits in a Suspense boundary because `NavLink` reads `usePathname()`.
 * On static routes the pathname is known at prerender and the boundary
 * resolves in the shell. On the fallback shell of a dynamic route (a product
 * slug not listed at build) it is not, and without the boundary the build
 * fails; there the plain links are prerendered and the current-page marker
 * streams in.
 */
export function Header() {
  return (
    <header className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:h-16 sm:px-6">
      <div className="flex items-center gap-6 sm:gap-8">
        <Logo />
        <nav aria-label="Main">
          <Suspense
            fallback={
              <NavList>
                {({ href, label }) => (
                  <Link href={href} className="text-fg-secondary hover:text-fg">
                    {label}
                  </Link>
                )}
              </NavList>
            }
          >
            <NavList>
              {({ href, label }) => <NavLink href={href}>{label}</NavLink>}
            </NavList>
          </Suspense>
        </nav>
      </div>
      <Suspense fallback={<CartIcon count={null} />}>
        <CartBadge />
      </Suspense>
    </header>
  )
}
