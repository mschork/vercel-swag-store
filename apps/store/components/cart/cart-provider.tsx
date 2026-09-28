'use client'

import {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  addToCart,
  prepareCart,
  type AddToCartState,
  type CartActionResult,
} from '@/app/cart/actions'
import { inOrder } from '@/lib/cart/in-order'
import {
  cartTotals,
  setDraft,
  shownLines,
  type Drafts,
  type Line,
  type LineDisplay,
  type ShownLine,
  type Write,
} from '@/lib/cart/lines'

interface CartState {
  /** The cart's lines, writes in flight and drafts applied; `null` until the session is read. */
  lines: ShownLine[] | null
  /** Lines of adds in flight when the session has not been read. */
  unseeded: ShownLine[]
  /** How many of a product the cart holds, counting writes in flight. */
  quantity: (productId: string) => number
  /** The last add that failed, until the next write. */
  failure: { productId: string; message: string } | null
}

interface CartActions {
  /** The cart mirror as the server read it; `null` leaves what the client holds. */
  seed: (lines: Line[] | null) => void
  /** Records a pending line, saves the add behind any write still saving and applies the answer. */
  add: (
    productId: string,
    display: LineDisplay,
    quantity: number,
    data: FormData,
  ) => Promise<CartActionResult>
  /** Saves a line's new quantity, 0 to remove it, and applies the answer. */
  change: (
    productId: string,
    quantity: number,
    action: () => Promise<CartActionResult>,
  ) => Promise<CartActionResult>
  /** Shows a quantity a row has not saved yet; `null` drops it, with `onlyIf` only while it holds that value. */
  draft: (productId: string, quantity: number | null, onlyIf?: number) => void
  /** Applies an answer the native form post brought. */
  apply: (result: AddToCartState) => void
  /** Forgets the failed add, once the page that said it closes. */
  dismissFailure: () => void
}

const CartContext = createContext<CartState | null>(null)
const CartActionsContext = createContext<CartActions | null>(null)

const FAILED: CartActionResult = { ok: false, error: 'This item could not be added. Try again.' }

/**
 * The browser's copy of the cart, which the badge, every stock count and the
 * cart page read. The saved lines come from the session on a full load and
 * are replaced by each write's answer; the writes in flight sit above them,
 * and a row's unsaved quantity above those. An answer replaces the lines and
 * drops its write in one update, so no count shows both.
 *
 * Writes in flight are plain state, not `useOptimistic`, whose transition
 * would hold every navigation until the save answers
 * (docs/adr/0009-one-cart-provider.md).
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Line[] | null>(null)
  const [writes, setWrites] = useState<readonly Write[]>([])
  const [drafts, setDrafts] = useState<Drafts>({})
  const [failure, setFailure] = useState<CartState['failure']>(null)

  const write = useCallback(
    async (entry: Write, action: () => Promise<CartActionResult>) => {
      setFailure(null)
      setWrites((current) => [...current, entry])
      const result = (await inOrder(action).catch(() => null)) ?? FAILED
      if (result.lines) setSaved(result.lines)
      setWrites((current) => current.filter((pending) => pending !== entry))
      if (entry.kind === 'set') {
        setDrafts((current) => setDraft(current, entry.productId, null, entry.quantity))
      } else if (!result.ok) {
        setFailure({
          productId: entry.productId,
          message: `${entry.display.name}: ${result.error}`,
        })
      }
      return result
    },
    [],
  )

  const actions = useMemo<CartActions>(
    () => ({
      seed: (lines) => {
        if (lines) setSaved(lines)
      },
      add: (productId, display, quantity, data) =>
        write({ kind: 'add', productId, quantity, display }, async () =>
          (await addToCart(null, data)) ?? FAILED,
        ),
      change: (productId, quantity, action) =>
        write({ kind: 'set', productId, quantity }, action),
      draft: (productId, quantity, onlyIf) =>
        setDrafts((current) => setDraft(current, productId, quantity, onlyIf)),
      apply: (result) => {
        if (result?.lines) setSaved(result.lines)
      },
      dismissFailure: () => setFailure(null),
    }),
    [write],
  )

  const state = useMemo<CartState>(() => {
    const shown = shownLines(saved ?? [], writes, drafts)
    return {
      lines: saved ? shown : null,
      unseeded: saved ? [] : shown,
      quantity: (productId) => shown.find((line) => line.productId === productId)?.quantity ?? 0,
      failure,
    }
  }, [saved, writes, drafts, failure])

  return (
    <CartActionsContext value={actions}>
      <CartContext value={state}>{children}</CartContext>
    </CartActionsContext>
  )
}

export function useCart(): CartState {
  const state = use(CartContext)
  if (!state) throw new Error('useCart needs a CartProvider')
  return state
}

export function useCartActions(): CartActions {
  const actions = use(CartActionsContext)
  if (!actions) throw new Error('useCartActions needs a CartProvider')
  return actions
}

/**
 * The badge's number: the lines' total once the session is read, before that
 * the server's count plus the adds in flight. `null` is unknown.
 */
export function useCartCount(serverCount: number | null): number | null {
  const { lines, unseeded } = useCart()
  if (lines) return cartTotals(lines).totalItems
  return serverCount === null ? null : serverCount + cartTotals(unseeded).totalItems
}

// Once per page load: the first form to see intent opens the cart.
let cartPrepared = false

/**
 * Opens the visitor's cart on intent, so their first add finds it there and
 * costs one slow call.
 */
export function prepareOnIntent(): void {
  if (cartPrepared) return
  cartPrepared = true
  void inOrder(prepareCart)
}
