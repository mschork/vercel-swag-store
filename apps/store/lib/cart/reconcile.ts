import 'server-only'
import { getCart } from '@/lib/api/cart'
import { sessionStore } from '@/lib/session/store'
import { toLines, type Line } from './lines'

/**
 * Reads the API's cart for a session and corrects its cart mirror for the
 * next render (docs/adr/0007-the-session-store.md). `savedAt` is the mirror
 * the render showed. A mirror saved since then holds a newer answer than this
 * read, so it is left alone. Never throws: a failure is logged and ignored.
 */
export async function reconcileCart(sid: string, savedAt: number): Promise<void> {
  try {
    const shown = await sessionStore.read(sid)
    if (shown === 'unavailable' || shown.cart?.savedAt !== savedAt) return
    const cart = await getCart(shown.cart.token)

    const latest = await sessionStore.read(sid)
    if (latest === 'unavailable' || latest.cart?.savedAt !== savedAt) return
    if (!cart) {
      await sessionStore.clearCart(sid)
      return
    }
    const lines = toLines(cart)
    if (cart.totalItems === latest.cart.totalItems && sameLines(lines, latest.cart.lines)) {
      return
    }
    await sessionStore.setCart(sid, {
      token: latest.cart.token,
      currency: cart.currency,
      lines,
      totalItems: cart.totalItems,
    })
  } catch (error) {
    console.error('[cart] could not re-read the cart for its mirror', error)
  }
}

function sameLines(a: readonly Line[], b: readonly Line[]): boolean {
  return (
    a.length === b.length &&
    a.every((line, index) => {
      const other = b[index]
      return (
        other !== undefined &&
        line.productId === other.productId &&
        line.slug === other.slug &&
        line.name === other.name &&
        line.image === other.image &&
        line.price === other.price &&
        line.quantity === other.quantity
      )
    })
  )
}
