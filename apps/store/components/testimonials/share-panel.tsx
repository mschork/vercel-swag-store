'use client'

import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Where the testimonial chat renders. It holds no conversation yet: opening
 * it starts nothing, and the heading takes focus so a screen reader announces
 * what opened.
 */
export function SharePanel({ onClose }: { onClose: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [])
  return (
    <section
      aria-labelledby="share-heading"
      className="flex flex-col items-start gap-4 rounded-lg border border-border p-6"
    >
      <h2 id="share-heading" ref={heading} tabIndex={-1} className="text-xl font-medium tracking-tight outline-none">
        Share your testimonial
      </h2>
      <p className="max-w-prose text-fg-secondary">
        The conversation that takes your photo and your words is not open yet.
      </p>
      <Button variant="outline" size="lg" className="px-4" onClick={onClose}>
        Close
      </Button>
    </section>
  )
}
