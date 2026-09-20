import type { Promotion } from '@/lib/api/types'

/** What `POST /api/visit` answers with: the visitor's own counts and promotion. */
export interface OpenedVisit {
  stock: Record<string, number>
  promotion: Promotion | null
}

/**
 * The browser's two calls to the visit endpoint. They live here rather than in
 * the components so no component holds a `fetch`, the same rule the server
 * side follows in `lib/api/`.
 */
export async function openVisit(): Promise<OpenedVisit | null> {
  return post<OpenedVisit>('POST')
}

export async function resetVisit(): Promise<boolean> {
  return (await post<{ ok: boolean }>('DELETE')) !== null
}

/**
 * Returns `null` on any failure, which leaves the store showing "Stock
 * unavailable" rather than a wrong count. Nothing retries: the next full page
 * load seeds again and asks once more.
 */
async function post<T>(method: 'POST' | 'DELETE'): Promise<T | null> {
  try {
    const response = await fetch('/api/visit', { method })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}
