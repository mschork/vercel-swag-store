'use client'

import { useRouter } from 'next/navigation'
import { VisualEditing } from 'next-sanity/visual-editing'
import { useCallback } from 'react'

/**
 * The overlay, plus the one thing it does not do by itself (E17): re-render
 * the route when the Studio reports an edit. next-sanity leaves a `mutation`
 * to the app because it cannot know how the app reads content; here every
 * read goes through `sanityFetch`, which draft mode runs uncached, so a plain
 * `router.refresh()` returns the draft the editor just typed.
 *
 * The promise tells the Studio how long to show its refresh spinner. A client
 * component, because `refresh` is a function and takes the router.
 */
export function DraftVisualEditing() {
  const router = useRouter()
  const refresh = useCallback(() => {
    router.refresh()
    return new Promise<void>((resolve) => setTimeout(resolve, 1000))
  }, [router])
  return <VisualEditing refresh={refresh} />
}
