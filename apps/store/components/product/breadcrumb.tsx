import type { Route } from 'next'
import Link from 'next/link'
import type { Crumb } from '@/lib/structured-data'

/** A breadcrumb step that links within the store; typed routes check `href`. */
export interface BreadcrumbLink extends Crumb {
  href: Route
}

/**
 * Home / category / product. `trail` holds the linked steps; `current` is the
 * page itself, shown last and not linked.
 */
export function Breadcrumb({
  trail,
  current,
}: {
  trail: readonly BreadcrumbLink[]
  current: string
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-secondary">
        {trail.map((step) => (
          <li key={step.href} className="flex items-center gap-2">
            <Link href={step.href} className="hover:text-fg">
              {step.name}
            </Link>
            <span aria-hidden="true">/</span>
          </li>
        ))}
        <li>
          <span aria-current="page" className="text-fg">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  )
}
