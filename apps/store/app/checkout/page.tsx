import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/container'
import { PortableText } from '@/components/portable-text'
import { CHECKOUT_FALLBACK } from '@/lib/content/fallbacks'
import { getCheckoutPage } from '@/lib/sanity/content'

export const metadata: Metadata = {
  title: CHECKOUT_FALLBACK.title,
  robots: { index: false },
}

/**
 * Where a demo order lands. Still fully static: it reads no cookies, because
 * `placeOrder` drops the cart before redirecting here, and the Sanity read is
 * cached like every other. The copy comes from the `checkoutPage` document
 * when it exists, and from E06's fallback otherwise.
 */
export default async function CheckoutPage() {
  const content = await getCheckoutPage()
  const title = content?.title || CHECKOUT_FALLBACK.title
  const label = content?.continueShoppingLabel || CHECKOUT_FALLBACK.continueShoppingLabel
  return (
    <Container className="flex flex-col gap-4 py-12">
      <h1 className="text-3xl font-medium tracking-tight">{title}</h1>
      {content?.body ? (
        <div className="max-w-prose text-fg-secondary">
          <PortableText value={content.body} />
        </div>
      ) : (
        <p className="max-w-prose text-fg-secondary">{CHECKOUT_FALLBACK.body}</p>
      )}
      <p>
        <Link href="/" className="underline underline-offset-4">
          {label}
        </Link>
      </p>
    </Container>
  )
}
