import type { Promotion } from '@/lib/api/types'

/** What `POST /api/visit` answers with: the visitor's own counts and promotion. */
export interface OpenedVisit {
  stock: Record<string, number>
  promotion: Promotion | null
}

/**
 * The opening draws a browser hands to `POST /api/visit`
 * (specs/E21-first-visit.md): at most one product's draw and one promotion.
 * `readHandBack` checks them on the server.
 */
export interface HandBack {
  draw?: { productId: string; count: number }
  promotion?: Promotion
}

/**
 * The browser's two calls to the visit endpoint. They live here rather than in
 * the components so no component holds a `fetch`, the same rule the server
 * side follows in `lib/api/`.
 */
export async function openVisit(handBack: HandBack = {}): Promise<OpenedVisit | null> {
  return post<OpenedVisit>('POST', handBack)
}

export async function resetVisit(): Promise<boolean> {
  return (await post<{ ok: boolean }>('DELETE')) !== null
}

/**
 * Returns `null` on any failure, which leaves the store showing "Stock
 * unavailable" rather than a wrong count. Nothing retries: the next full page
 * load seeds again and asks once more.
 */
async function post<T>(method: 'POST' | 'DELETE', body?: HandBack): Promise<T | null> {
  try {
    const response = await fetch('/api/visit', {
      method,
      ...(body ? { body: JSON.stringify(body), headers: { 'content-type': 'application/json' } } : {}),
    })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}
