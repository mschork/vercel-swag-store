import Link from 'next/link'
import { EmptyState } from '@/components/empty-state'
import { Button } from '@/components/ui/button'

/** The empty cart's heading, which takes focus when the last line is removed. */
export const EMPTY_CART_HEADING = 'empty-cart-heading'

/**
 * Shown when there is no cart, it expired, or its last line was removed, and
 * no add is saving. Rendered by the cart view, which also reaches zero lines
 * optimistically before the server confirms.
 */
export function EmptyCart() {
  return (
    <EmptyState title="Your cart is empty" headingId={EMPTY_CART_HEADING}>
      <Button size="lg" nativeButton={false} render={<Link href="/search" />}>
        Search products
      </Button>
    </EmptyState>
  )
}
