import type { Promotion } from '@/lib/api/types'

/** What `DELETE /api/visit` answers with: the visitor's new draws and promotion. */
export interface OpenedVisit {
  stock: Record<string, number>
  promotion: Promotion | null
}

/**
 * The browser's call to throw the visit away. It lives here rather than in a
 * component so no component holds a `fetch`, the same rule the server side
 * follows in `lib/api/`. `null` on any failure, which leaves the visit the
 * client holds; nothing retries.
 */
export async function resetVisit(): Promise<OpenedVisit | null> {
  try {
    const response = await fetch('/api/visit', { method: 'DELETE' })
    if (!response.ok) return null
    return (await response.json()) as OpenedVisit
  } catch {
    return null
  }
}
