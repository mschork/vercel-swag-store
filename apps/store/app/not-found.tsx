import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <section className="flex flex-col gap-4 py-12">
      <h1 className="text-2xl font-medium">Page not found</h1>
      <p className="text-fg-secondary">There is nothing at this address.</p>
      <p className="flex gap-4">
        <Link href="/" className="underline underline-offset-4">
          Go home
        </Link>
        <Link href="/search" className="underline underline-offset-4">
          Search products
        </Link>
      </p>
    </section>
  )
}
