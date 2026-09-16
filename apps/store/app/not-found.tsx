import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/container'

export const metadata: Metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <Container className="flex flex-col gap-4 py-12">
      <h1 className="text-3xl font-medium tracking-tight">Page not found</h1>
      <p className="text-fg-secondary">There is nothing at this address.</p>
      <p className="flex gap-4">
        <Link href="/" className="underline underline-offset-4">
          Go home
        </Link>
        <Link href="/search" className="underline underline-offset-4">
          Search products
        </Link>
      </p>
    </Container>
  )
}
