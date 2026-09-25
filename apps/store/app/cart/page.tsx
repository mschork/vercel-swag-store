import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Container } from '@/components/container'
import {
  CartContents,
  CartSkeleton,
} from '@/components/cart/cart-contents'
import { CartFavourites } from '@/components/cart/cart-favourites'

export const metadata: Metadata = { title: 'Cart', robots: { index: false } }

/**
 * The heading and the favourites row are prerendered with the shell;
 * everything that depends on the visitor's session streams inside one
 * boundary.
 */
export default function CartPage() {
  return (
    <Container className="flex flex-col gap-6 py-8 md:gap-8 md:py-12">
      <h1 className="text-3xl font-medium tracking-tight">Cart</h1>
      <Suspense fallback={<CartSkeleton />}>
        <CartContents />
      </Suspense>
      <CartFavourites />
    </Container>
  )
}
