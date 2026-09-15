import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Product not found' }

/** Rendered inside the root layout, so header and footer stay. */
export default function ProductNotFound() {
  return (
    <section className="flex flex-col gap-4 py-12">
      <h1 className="text-2xl font-medium">Product not found</h1>
      <p className="text-fg-secondary">
        There is no product at this address. It may have been removed.
      </p>
      <p className="flex gap-4">
        <Link href="/search" className="underline underline-offset-4">
          Search products
        </Link>
        <Link href="/" className="underline underline-offset-4">
          Go home
        </Link>
      </p>
    </section>
  )
}
