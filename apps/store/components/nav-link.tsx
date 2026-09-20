'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'
import { PendingScope } from './pending-scope'
import { cn } from '@/lib/utils'

type Props = Omit<ComponentProps<typeof Link>, 'aria-current'> & {
  /** Paths under this prefix also count as this link's page (a section, not one URL). */
  currentUnder?: string
}

/**
 * A nav link that marks itself as the current page and fades to the
 * secondary colour while its navigation is pending.
 */
export function NavLink({ href, currentUnder, className, children, ...rest }: Props) {
  const pathname = usePathname()
  const current =
    pathname === href || Boolean(currentUnder && pathname.startsWith(currentUnder))
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className={cn(
        className,
        current ? 'text-fg' : 'text-fg-secondary hover:text-fg',
      )}
      {...rest}
    >
      <PendingScope
        className="motion-safe:transition-colors motion-safe:duration-250"
        pendingClassName="text-fg-secondary"
      >
        {children}
      </PendingScope>
    </Link>
  )
}
