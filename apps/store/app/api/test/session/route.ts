import { connection, NextResponse } from 'next/server'
import { z } from 'zod'
import { addCartItem, createCart } from '@/lib/api/cart'
import { PromotionSchema } from '@/lib/api/schemas'
import type { Promotion } from '@/lib/api/types'
import { toLines } from '@/lib/cart/lines'
import { serverEnv } from '@/lib/env'
import { CART_MAX_QUANTITY } from '@/lib/quantity'
import { getSessionId } from '@/lib/session/cookie'
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/session/id'
import { sessionStore, type VisitRecord } from '@/lib/session/store'

/**
 * Seeds and reads the caller's session for the Playwright suite
 * (specs/E24-session-store.md). It exists only when `E2E_SEED` is `1`, which
 * only the Playwright web server sets; otherwise every method answers 404
 * before reading the cookie or the store.
 */

// Anyone who reaches the route can post to it, so the body is a trust boundary.
const SeedInput = z
  .object({
    /** The visit's draws: the visit holds these and no others. */
    stock: z.record(z.string().min(1), z.int().min(0).max(CART_MAX_QUANTITY)).optional(),
    /** The visit's promotion; `null` pins none. */
    promotion: PromotionSchema.nullable().optional(),
    /** Items for a new API cart, which becomes the mirror. */
    cart: z
      .array(z.object({ productId: z.string().min(1), quantity: z.int().positive() }))
      .min(1)
      .optional(),
  })
  .strict()

/** What a spec reads back: the visit's draws and promotion. */
type SeededVisit = { stock: Record<string, number>; promotion: Promotion | null } | null

const enabled = () => serverEnv.E2E_SEED === '1'
const notFound = () => new Response('Not found', { status: 404 })
const unavailable = () =>
  Response.json({ error: 'The session store cannot be reached.' }, { status: 503 })

/** The caller's visit, or `null` when it has none. */
export async function GET(): Promise<Response> {
  // Without it the build prerenders the 404 this answers there.
  await connection()
  if (!enabled()) return notFound()
  const sid = await getSessionId()
  if (!sid) return Response.json(null)
  const state = await sessionStore.read(sid)
  return state === 'unavailable' ? unavailable() : Response.json(shown(state.visit))
}

/**
 * Seeds the caller's session and answers the visit it now holds. `stock` or
 * `promotion` replaces the visit: it is cleared, then holds what the body
 * names, and a render draws the rest. A caller without a session id gets
 * one, minted as the proxy mints it.
 */
export async function POST(request: Request): Promise<Response> {
  if (!enabled()) return notFound()
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'The body is not JSON.' }, { status: 400 })
  }
  const input = SeedInput.safeParse(body)
  if (!input.success) {
    return Response.json({ error: z.prettifyError(input.error) }, { status: 400 })
  }
  const { stock, promotion, cart } = input.data

  const existing = await getSessionId()
  const sid = existing ?? crypto.randomUUID()
  if (stock !== undefined || promotion !== undefined) {
    if (!(await sessionStore.clearVisit(sid))) return unavailable()
    if (stock && !(await sessionStore.setStock(sid, stock))) return unavailable()
    if (promotion !== undefined) await sessionStore.claimPromotion(sid, promotion)
  }
  if (cart) {
    const opened = await createCart()
    let saved = opened.cart
    for (const item of cart) {
      saved = await addCartItem(opened.token, item.productId, item.quantity)
    }
    const mirror = {
      token: opened.token,
      currency: saved.currency,
      lines: toLines(saved),
      totalItems: saved.totalItems,
    }
    if (!(await sessionStore.setCart(sid, mirror))) return unavailable()
  }

  const state = await sessionStore.read(sid)
  if (state === 'unavailable') return unavailable()
  const response = NextResponse.json(shown(state.visit))
  // A route handler's `cookies()` does not see the id the proxy minted for
  // this request, so such a caller gets two; this header comes second and wins.
  if (!existing) {
    response.cookies.set(SESSION_COOKIE, sid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })
  }
  return response
}

/** Every other method: the route's 404 while it is off, 405 while it is on. */
async function unsupported(): Promise<Response> {
  if (!enabled()) return notFound()
  return new Response('Method not allowed', {
    status: 405,
    headers: { allow: 'GET, HEAD, POST' },
  })
}

export const PUT = unsupported
export const PATCH = unsupported
export const DELETE = unsupported
export const OPTIONS = unsupported

function shown(visit: VisitRecord | null): SeededVisit {
  return visit ? { stock: visit.stock, promotion: visit.promotion ?? null } : null
}
