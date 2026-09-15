import type { Metadata } from 'next'
import { Suspense } from 'react'
import {
  CartContents,
  CartSkeleton,
} from '@/components/cart/cart-contents'

export const metadata: Metadata = { title: 'Cart', robots: { index: false } }

/**
 * The heading is prerendered with the shell; everything that depends on the
 * cart cookie streams inside one boundary.
 */
export default function CartPage() {
  return (
    <div className="flex flex-col gap-6 py-6 md:gap-8 md:py-10">
      <h1 className="text-3xl font-medium tracking-tight md:text-4xl">Cart</h1>
      <Suspense fallback={<CartSkeleton />}>
        <CartContents />
      </Suspense>
    </div>
  )
}
