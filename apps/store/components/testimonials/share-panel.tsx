'use client'

import { useEffect, useRef, useState } from 'react'
import { Spinner } from '@/components/spinner'
import { Button } from '@/components/ui/button'
import { Chat } from './chat/chat'
import type { ChatProduct, CurrentChat } from './chat/types'

/**
 * Where the testimonial chat renders. Opening it starts no run: `chat` is the
 * GET for the session's conversation still going, started when the chat
 * opened; the panel resumes that one or shows the greeting. A restart starts
 * from the greeting and never reuses that answer. The heading takes focus so
 * a screen reader announces what opened.
 */
export function SharePanel({
  products,
  chat,
  onClose,
}: {
  products: ChatProduct[]
  chat: Promise<CurrentChat>
  onClose: () => void
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  const [current, setCurrent] = useState<CurrentChat | undefined>(undefined)
  const [attempt, setAttempt] = useState(0)

  // The panel opens where the link was, so focus moves without scrolling;
  // arriving on `#share` has already scrolled the panel into view.
  useEffect(() => heading.current?.focus({ preventScroll: true }), [])
  useEffect(() => {
    let live = true
    void chat.then((answer) => {
      if (live) setCurrent(answer)
    })
    return () => {
      live = false
    }
  }, [chat])

  return (
    <section aria-labelledby="share-heading" className="flex flex-col gap-6 rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 id="share-heading" ref={heading} tabIndex={-1} className="text-xl font-medium tracking-tight outline-none">
          Share your testimonial
        </h2>
        <Button variant="outline" size="lg" className="px-4" onClick={onClose}>
          Close
        </Button>
      </div>
      {current === undefined ? (
        <p className="flex items-center gap-2 text-sm text-fg-secondary">
          <Spinner /> Loading…
        </p>
      ) : (
        <Chat
          key={attempt}
          initial={attempt === 0 ? current : null}
          products={products}
          onRestart={() => setAttempt((n) => n + 1)}
        />
      )}
    </section>
  )
}
