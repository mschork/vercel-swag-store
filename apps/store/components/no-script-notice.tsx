import { Container } from '@/components/container'

/**
 * What a browser without JavaScript gets in place of the parts that need it:
 * one notice, and no skeleton. React reveals a streamed hole with a script,
 * so without one every Suspense fallback would stay on screen for good.
 */
export function NoScriptNotice() {
  return (
    <noscript>
      <style>{'[data-slot="skeleton"]{display:none}'}</style>
      <Container className="py-3">
        <p className="text-sm leading-6 text-fg-secondary">
          Thank you for your visit. Unfortunately not all functionality can be served to your
          browser if Javascript is not enabled.
        </p>
      </Container>
    </noscript>
  )
}
