'use client'

import { useRouter } from 'next/navigation'
import { VisualEditing } from 'next-sanity/visual-editing'
import { useCallback } from 'react'

/**
 * The overlay, plus the re-render it leaves to the app: next-sanity hands
 * `mutation` over because it cannot know how the app reads content. Here every
 * read goes through `sanityFetch`, which draft mode runs uncached, so a plain
 * `router.refresh()` returns the draft the editor just typed.
 *
 * The promise tells the Studio how long to show its refresh spinner.
 */
export function DraftVisualEditing() {
  const router = useRouter()
  const refresh = useCallback(() => {
    router.refresh()
    return new Promise<void>((resolve) => setTimeout(resolve, 1000))
  }, [router])
  return <VisualEditing refresh={refresh} />
}
