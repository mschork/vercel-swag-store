import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing'
import { DraftModeBar } from './draft-mode-bar'

/**
 * Everything an editor's browser gets and a visitor's does not (E17): the
 * visual-editing overlay, and a bar to leave draft mode when the page is open
 * on its own rather than framed by the Studio. Rendered from the root layout
 * inside `<Suspense fallback={null}>`, so the shell stays static; outside
 * draft mode it renders nothing and none of its JavaScript is sent.
 */
export async function DraftMode() {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return null
  return (
    <>
      <VisualEditing />
      <DraftModeBar />
    </>
  )
}
