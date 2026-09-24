import 'server-only'
import { cookies } from 'next/headers'
import { isSessionId, SESSION_COOKIE } from './id'

/**
 * The request's session id, or `null` when it carries none the store can use.
 * A page rendered for a browser's first request already sees the id the proxy
 * has just minted; a route handler does not, and answers without a session.
 */
export async function getSessionId(): Promise<string | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value
  return isSessionId(value) ? value : null
}
