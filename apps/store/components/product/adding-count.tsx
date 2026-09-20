'use client'

import { useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { useCartCount } from '@/components/cart/cart-count'
import { useVisit } from '@/components/visit/visit-provider'

/**
 * Reports the add this form has in flight: how many items, so the header badge
 * counts up at once, and how many of this product, so its stock line and card
 * badge count down. Both go back to 0 when the submit settles or the form
 * unmounts, which is what puts the numbers back after a failed add.
 *
 * It renders nothing and must sit inside the form, because `useFormStatus`
 * reads the form above it.
 */
export function AddingCount({ productId }: { productId: string }) {
  const { pending, data } = useFormStatus()
  const { setAdding } = useCartCount()
  const { setAdding: setAddingForProduct } = useVisit()
  const quantity = pending ? Number(data?.get('quantity')) : 0
  const adding = Number.isInteger(quantity) && quantity > 0 ? quantity : 0
  useEffect(() => {
    setAdding(adding)
    setAddingForProduct(productId, adding)
  }, [adding, productId, setAdding, setAddingForProduct])
  useEffect(
    () => () => {
      setAdding(0)
      setAddingForProduct(productId, 0)
    },
    [productId, setAdding, setAddingForProduct],
  )
  return null
}
