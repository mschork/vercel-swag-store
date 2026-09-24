import Link from 'next/link'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'

/**
 * Shown when there is no cart, it expired, or its last line was removed, and
 * no add is saving. Rendered by the cart view, which also reaches zero lines
 * optimistically before the server confirms.
 */
export function EmptyCart() {
  return (
    <EmptyState title="Your cart is empty">
      <Button size="lg" render={<Link href="/search" />}>
        Search products
      </Button>
    </EmptyState>
  )
}
