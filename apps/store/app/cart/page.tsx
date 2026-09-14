import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cart', robots: { index: false } }

/** Stub so the header badge can link here; E06 provides the page. */
export default function CartPage() {
  return <h1 className="py-12 text-2xl font-medium">Cart</h1>
}
