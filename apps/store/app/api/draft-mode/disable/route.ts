import { draftMode } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { sameOriginPath } from '@/lib/safe-redirect'

/**
 * Leaves draft mode and returns to the page the editor was on (E17). The
 * target comes from the query string, so it is reduced to a same-origin path:
 * this route must not become an open redirect.
 */
export async function GET(request: NextRequest) {
  const draft = await draftMode()
  draft.disable()
  const path = sameOriginPath(request.nextUrl.searchParams.get('redirect'))
  return NextResponse.redirect(new URL(path, request.nextUrl.origin))
}
