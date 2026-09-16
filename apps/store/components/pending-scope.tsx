'use client'

import { useLinkStatus } from 'next/link'
import { cn } from '@/lib/utils'

/**
 * A span inside a `Link` that takes `pendingClassName` while that link's
 * navigation is in flight (`useLinkStatus`). The only client code a product
 * card or a nav link needs: the content it wraps is rendered by whichever
 * component owns the link.
 */
export function PendingScope({
  pendingClassName,
  className,
  ...props
}: React.ComponentProps<'span'> & { pendingClassName: string }) {
  const { pending } = useLinkStatus()
  return (
    <span
      data-pending={pending || undefined}
      className={cn(className, pending && pendingClassName)}
      {...props}
    />
  )
}
