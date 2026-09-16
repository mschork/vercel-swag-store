import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/container'
import { CHECKOUT_FALLBACK } from '@/lib/content/fallbacks'

export const metadata: Metadata = {
  title: CHECKOUT_FALLBACK.title,
  robots: { index: false },
}

/**
 * Where a demo order lands. Fully static: it reads no cookies, because
 * `placeOrder` has already dropped the cart before redirecting here, and it
 * has no link back to the cart, which is empty now. E09 reads the copy from
 * the Sanity `checkoutPage` singleton with this as the fallback.
 */
export default function CheckoutPage() {
  const { title, body, continueShoppingLabel } = CHECKOUT_FALLBACK
  return (
    <Container className="flex flex-col gap-4 py-12">
      <h1 className="text-3xl font-medium tracking-tight">
        {title}
      </h1>
      <p className="max-w-prose text-fg-secondary">{body}</p>
      <p>
        <Link href="/" className="underline underline-offset-4">
          {continueShoppingLabel}
        </Link>
      </p>
    </Container>
  )
}
