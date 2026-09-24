import { NextResponse, userAgent, type NextRequest } from 'next/server'
import { isSessionId, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/session/id'

/**
 * Mints the session id cookie (docs/adr/0007-the-session-store.md). It does
 * no I/O, and `cookies()` sees the new id in the same request, so the first
 * render already has a session.
 *
 * The matcher skips any request whose cookie already holds a valid id. Such a
 * request never invokes this function, and its page is served from the CDN
 * as fast as it is without a proxy; only a browser's first request pays for
 * it. A matcher must be a literal, so it repeats the id's pattern, and
 * `proxy.test.ts` checks the two agree.
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next()
  if (isSessionId(request.cookies.get(SESSION_COOKIE)?.value)) return response
  // A crawler or a link preview keeps no cookie, so every request of its would
  // open a session and draw the whole catalogue into it. Without one it gets
  // the store's path for an unreadable session: the page shows the API's
  // answers and keeps nothing.
  if (userAgent(request).isBot) return response
  response.cookies.set(SESSION_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return response
}

export const config = {
  matcher: [
    {
      source:
        '/((?!_next/static|_next/image|_vercel|favicon.ico|robots.txt|sitemap.xml|llms.txt|api/revalidate|api/demand).*)',
      missing: [
        {
          type: 'cookie',
          key: 'sid',
          value: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}',
        },
      ],
    },
  ],
}
