/**
 * The session id: a random UUID in the one cookie the store sets. It
 * identifies a browser and nothing more (docs/adr/0007-the-session-store.md).
 * Free of `server-only` because the proxy imports it.
 */
export const SESSION_COOKIE = 'sid'

/** Thirty days. The proxy writes the cookie only when it is missing, so it never slides. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

const SESSION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export function isSessionId(value: string | undefined): value is string {
  return value !== undefined && SESSION_ID.test(value)
}
