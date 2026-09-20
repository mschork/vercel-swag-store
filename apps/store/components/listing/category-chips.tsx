import Link from 'next/link'
import type { Category } from '@/lib/api/types'
import { categoryPath } from '@/lib/listing'
import { cn } from '@/lib/utils'
import { ChipRow } from './chip-row'

/**
 * The listing's category filter (specs/E18-product-listing.md). Links, not a
 * select: each category is a page of its own, so moving between them is
 * navigation, which works without JavaScript, is prefetched and can be
 * crawled. Below md the row scrolls sideways so the grid starts within the
 * first screen, and `ChipRow` brings the current chip into view; the padding
 * and negative margin keep focus rings unclipped.
 */
export function CategoryChips({
  categories,
  current,
}: {
  categories: readonly Category[]
  /** The category being shown, or `null` on `/products`. */
  current: string | null
}) {
  return (
    <nav aria-label="Categories">
      <ChipRow>
        <li className="shrink-0">
          <Chip href="/products" active={current === null}>
            All
          </Chip>
        </li>
        {categories.map((category) => (
          <li key={category.slug} className="shrink-0">
            <Chip
              href={categoryPath(category.slug)}
              active={current === category.slug}
            >
              {category.name}
            </Chip>
          </li>
        ))}
      </ChipRow>
    </nav>
  )
}

function Chip({
  href,
  active,
  children,
}: {
  href: React.ComponentProps<typeof Link>['href']
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-9 items-center rounded-full border px-3.5 text-sm whitespace-nowrap motion-safe:transition-colors motion-safe:duration-250',
        active
          ? 'border-fg bg-fg text-bg'
          : 'border-border text-fg-secondary hover:border-border-strong hover:text-fg',
      )}
    >
      {children}
    </Link>
  )
}
