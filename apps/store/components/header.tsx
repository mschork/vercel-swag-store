import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'
import { CartBadge } from './cart/cart-badge'
import { CartIcon } from './cart/cart-icon'
import { Container } from './container'
import { Logo } from './logo'
import { NavLink } from './nav-link'
import { StickyHeader } from './sticky-header'

type NavItem = {
  href: '/' | '/products' | '/search'
  label: string
  /** Also current on every path under this prefix. */
  currentUnder?: string
  icon?: ReactNode
}

/** Decorative; the link's label names it. */
const SearchGlyph = (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="inline-block align-[-0.2em] sm:mr-1.5"
  >
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.9-4.9" />
  </svg>
)

/**
 * "Products" stays current on the category pages of the listing, not on a
 * product page, which is a step further in (specs/E18-product-listing.md).
 */
const NAV: readonly NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products', currentUnder: '/products/category/' },
  { href: '/search', label: 'Search', icon: SearchGlyph },
]

/**
 * Below sm a link with a glyph shows the glyph alone; the label stays in the
 * DOM as its name. The glyph is inline and nudged onto the text, never a flex
 * item: an inline-flex wrapper takes its baseline from the SVG and lifts the
 * word above its neighbours.
 */
const navLabel = ({ icon, label }: NavItem) =>
  icon ? (
    <>
      {icon}
      <span className="max-sm:sr-only">{label}</span>
    </>
  ) : (
    label
  )

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
 * Full width and sticky; the content aligns to the column. The nav sits in a
 * Suspense boundary because `NavLink` reads `usePathname()`, which is unknown
 * at prerender on a dynamic route's fallback shell; without the boundary the
 * build fails.
 */
export function Header() {
  return (
    <StickyHeader>
      <Container className="flex h-14 items-center justify-between gap-6">
        <div className="flex items-center gap-6 sm:gap-8">
          <Logo />
          <nav aria-label="Main">
            <Suspense
              fallback={
                <NavList>
                  {(item) => (
                    <Link href={item.href} className="text-fg-secondary hover:text-fg">
                      {navLabel(item)}
                    </Link>
                  )}
                </NavList>
              }
            >
              <NavList>
                {(item) => (
                  <NavLink href={item.href} currentUnder={item.currentUnder}>
                    {navLabel(item)}
                  </NavLink>
                )}
              </NavList>
            </Suspense>
          </nav>
        </div>
        <Suspense fallback={<CartIcon count={null} />}>
          <CartBadge />
        </Suspense>
      </Container>
    </StickyHeader>
  )
}
