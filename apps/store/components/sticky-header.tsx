'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * The sticky header element and the one thing about it that needs the
 * browser: a hairline that appears once the page has scrolled. A sentinel at
 * the very top of the page is watched with `IntersectionObserver`; while it is
 * out of view the header carries `data-scrolled`. The header's content is
 * passed in from the server.
 */
export function StickyHeader({ children }: { children: React.ReactNode }) {
  const sentinel = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const target = sentinel.current
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setScrolled(!entry.isIntersecting)
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="absolute top-0 h-px w-px" />
      <header
        data-scrolled={scrolled || undefined}
        className="sticky top-0 z-40 border-b border-transparent bg-bg motion-safe:transition-colors motion-safe:duration-250 data-scrolled:border-border"
      >
        {children}
      </header>
    </>
  )
}
