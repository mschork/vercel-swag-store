import { publicEnv } from '@/lib/env.public'

/**
 * A Markdown version's response. The canonical link credits the HTML page if
 * a crawler indexes the file anyway; `X-Robots-Tag: noindex` comes from the
 * headers every response carries (`lib/security-headers.ts`).
 */
export function markdownResponse(body: string, pagePath: string): Response {
  const canonical = new URL(pagePath, publicEnv.NEXT_PUBLIC_SITE_URL).href
  return new Response(body, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      Link: `<${canonical}>; rel="canonical"`,
    },
  })
}

/** An unknown slug, or a product the API no longer lists. */
export function markdownNotFound(): Response {
  return new Response('Not found\n', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
