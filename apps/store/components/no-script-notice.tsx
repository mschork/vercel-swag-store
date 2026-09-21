import { Container } from '@/components/container'

/**
 * Marks a box that only a script ever fills, so the notice's style rule hides
 * it. A skeleton needs no mark: the rule hides every one of them.
 */
export const NEEDS_SCRIPT = { 'data-needs-script': '' }

/**
 * What a browser without JavaScript gets in place of the parts that need it:
 * one notice, and no skeleton. React reveals a streamed hole with a script,
 * so without one every Suspense fallback would stay on screen for good.
 */
export function NoScriptNotice() {
  return (
    <noscript>
      <style>{'[data-slot="skeleton"],[data-needs-script]{display:none}'}</style>
      <Container className="py-3">
        <p className="text-sm leading-6 text-fg-secondary">
          Thank you for your visit. Unfortunately not all functionality can be served to your
          browser if Javascript is not enabled.
        </p>
      </Container>
    </noscript>
  )
}
