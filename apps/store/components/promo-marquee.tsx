'use client'

import { useEffect, useRef, useState } from 'react'

/** Scroll speed; the loop's duration follows from the text's width. */
const PX_PER_SECOND = 40

/**
 * One line that scrolls when it does not fit (E10). A `ResizeObserver`
 * compares the text to the strip; only an overflowing line animates, and it
 * keeps its centred, still layout otherwise. The loop is seamless because a
 * second, `aria-hidden` copy follows the first and both travel their own
 * width. Hover and focus pause it. Under `prefers-reduced-motion` the text
 * is allowed to wrap, so it never overflows and nothing moves.
 */
export function PromoMarquee({ children }: { children: React.ReactNode }) {
  const strip = useRef<HTMLDivElement>(null)
  const text = useRef<HTMLSpanElement>(null)
  const [width, setWidth] = useState<number | null>(null)

  useEffect(() => {
    const outer = strip.current
    const inner = text.current
    if (!outer || !inner) return
    const measure = () =>
      setWidth(inner.scrollWidth > outer.clientWidth ? inner.scrollWidth : null)
    const observer = new ResizeObserver(measure)
    observer.observe(outer)
    measure()
    return () => observer.disconnect()
  }, [])

  const scrolling = width !== null
  return (
    <div
      ref={strip}
      tabIndex={scrolling ? 0 : undefined}
      className="group/marquee w-full overflow-hidden outline-none focus-visible:outline-2 focus-visible:outline-accent-fg"
      style={scrolling ? { '--marquee-duration': `${width / PX_PER_SECOND}s` } as React.CSSProperties : undefined}
    >
      <div
        className={
          scrolling
            ? 'flex w-max motion-safe:[&>span]:animate-marquee group-hover/marquee:[&>span]:[animation-play-state:paused] group-focus-visible/marquee:[&>span]:[animation-play-state:paused]'
            : 'flex justify-center text-center'
        }
      >
        <span ref={text} className="motion-safe:whitespace-nowrap motion-safe:px-6">
          {children}
        </span>
        {scrolling ? (
          <span aria-hidden="true" className="motion-safe:whitespace-nowrap motion-safe:px-6">
            {children}
          </span>
        ) : null}
      </div>
    </div>
  )
}
