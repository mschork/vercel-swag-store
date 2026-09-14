'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'

type Props = Omit<ComponentProps<typeof Link>, 'aria-current'>

/** A nav link that marks itself as the current page. The only client code in the header. */
export function NavLink({ href, className, ...rest }: Props) {
  const pathname = usePathname()
  const current = pathname === href
  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className={[className, current ? 'text-fg' : 'text-fg-secondary hover:text-fg'].filter(Boolean).join(' ')}
      {...rest}
    />
  )
}
