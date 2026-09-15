import { unstable_rethrow } from 'next/navigation'

/**
 * Loads data a component can do without: on failure it logs and returns
 * `null` so the component renders its empty state instead of taking the
 * page down. Next's own control-flow errors (a prerender that finished
 * while an uncached call was pending, `notFound()`, redirects) are rethrown
 * first so React and Next still see them.
 */
export async function loadOptional<T>(
  label: string,
  load: () => Promise<T>,
): Promise<T | null> {
  try {
    return await load()
  } catch (error) {
    unstable_rethrow(error)
    console.error(`${label} unavailable, rendering without it`, error)
    return null
  }
}
