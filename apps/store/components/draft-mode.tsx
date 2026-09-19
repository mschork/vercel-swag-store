import { draftMode } from 'next/headers'
import { DraftModeBar } from './draft-mode-bar'
import { DraftVisualEditing } from './draft-visual-editing'

/**
 * Everything an editor's browser gets and a visitor's does not (E17): the
 * visual-editing overlay, which also refreshes the route as the editor types,
 * and a bar to leave draft mode when the page is open
 * on its own rather than framed by the Studio. Rendered from the root layout
 * inside `<Suspense fallback={null}>`, so the shell stays static; outside
 * draft mode it renders nothing and none of its JavaScript is sent.
 */
export async function DraftMode() {
  const { isEnabled } = await draftMode()
  if (!isEnabled) return null
  return (
    <>
      <DraftVisualEditing />
      <DraftModeBar />
    </>
  )
}
