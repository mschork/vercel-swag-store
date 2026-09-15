import Link from 'next/link'

/**
 * Shown when there is no cart, it expired, or its last line was removed. Used
 * by the server contents and by the client view, which reaches zero lines
 * optimistically before the server confirms.
 */
export function EmptyCart() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-fg-secondary">Your cart is empty.</p>
      <p>
        <Link href="/search" className="underline underline-offset-4">
          Search products
        </Link>
      </p>
    </div>
  )
}
