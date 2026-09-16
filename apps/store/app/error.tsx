'use client'

import { Container } from '@/components/container'
import { Button } from '@/components/ui/button'

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Container className="flex flex-col gap-4 py-12">
      <h1 className="text-3xl font-medium tracking-tight">Something went wrong</h1>
      <p className="text-fg-secondary">
        The page could not be rendered.
        {error.digest ? <span className="font-mono"> Reference {error.digest}.</span> : null}
      </p>
      <p>
        <Button type="button" size="lg" variant="outline" onClick={retry}>
          Try again
        </Button>
      </p>
    </Container>
  )
}
