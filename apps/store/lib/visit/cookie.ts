import 'server-only'
import { cookies } from 'next/headers'
import { cache } from 'react'
import {
  parseVisit,
  serialiseVisit,
  VISIT_MAX_AGE_SECONDS,
  visitAge,
  type Visit,
} from './visit'

/**
 * The visit cookie. Reading works wherever `cookies()` does; `setVisit` and
 * `clearVisit` work only in route handlers and Server Actions, because a page
 * cannot set a cookie.
 */
export const VISIT_COOKIE = 'visit'

/**
 * The visitor's visit, or `null` when there is none to use. Memoized per
 * request, so the layout's seed, the product page's hole and the banner share
 * one parse.
 */
export const getVisit = cache(async (): Promise<Visit | null> => {
  const raw = (await cookies()).get(VISIT_COOKIE)?.value
  return parseVisit(raw, Date.now())
})

/**
 * Writes the visit back, keeping its original `drawnAt`: the expiry counts
 * from the first draw and never slides, so a visit lasts one day whatever
 * happens inside it. Returns the product ids the cookie had no room for.
 */
export async function setVisit(visit: Visit): Promise<string[]> {
  const { value, dropped } = serialiseVisit(visit)
  const remaining = VISIT_MAX_AGE_SECONDS - visitAge(visit, Date.now())
  const store = await cookies()
  store.set(VISIT_COOKIE, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.max(1, remaining),
  })
  return dropped
}

export async function clearVisit(): Promise<void> {
  const store = await cookies()
  store.delete({ name: VISIT_COOKIE, path: '/' })
}
