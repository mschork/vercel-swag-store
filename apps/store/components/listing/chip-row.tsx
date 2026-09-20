'use client'

import { useEffect, useRef, useState } from 'react'

type Side = 'left' | 'right'

function Chevron({ side }: { side: Side }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={side === 'left' ? 'm14.5 6-6 6 6 6' : 'm9.5 6 6 6-6 6'} />
    </svg>
  )
}

/**
 * The chips' scrolling row (specs/E18-product-listing.md). Below md, where it
 * scrolls, it does two things beyond markup: on mount it moves to the current
 * chip without touching the page's own scroll, and a chevron on each side that
 * hides chips scrolls that way when pressed. The chevrons are pointer-only
 * (`tabIndex={-1}`, hidden from assistive technology) because the chips are
 * links in tab order and focusing one scrolls it into view.
 */
export function ChipRow({ children }: { children: React.ReactNode }) {
  const row = useRef<HTMLUListElement>(null)
  const [hidden, setHidden] = useState({ left: false, right: false })

  useEffect(() => {
    const list = row.current
    if (!list) return
    const current = list.querySelector<HTMLElement>('[aria-current="page"]')
    if (current) {
      const centred = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2
      list.scrollLeft = Math.max(0, centred)
    }
    const measure = () => {
      const left = list.scrollLeft > 1
      const right = list.scrollLeft + list.clientWidth < list.scrollWidth - 1
      setHidden((previous) =>
        previous.left === left && previous.right === right ? previous : { left, right },
      )
    }
    measure()
    list.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => {
      list.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [])

  const scroll = (side: Side) => {
    const list = row.current
    if (!list) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollBy({
      left: (side === 'left' ? -1 : 1) * list.clientWidth * 0.7,
      behavior: reduced ? 'auto' : 'smooth',
    })
  }

  return (
    <div className="relative">
      <ul
        ref={row}
        className="-m-1 flex [scrollbar-width:none] gap-2 overflow-x-auto p-1 md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
      {(['left', 'right'] as const).map((side) =>
        hidden[side] ? (
          <button
            key={side}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={() => scroll(side)}
            className={`absolute inset-y-0 flex w-8 items-center bg-bg text-fg-secondary hover:text-fg md:hidden ${
              side === 'left' ? '-left-1 justify-start' : '-right-1 justify-end'
            }`}
          >
            <Chevron side={side} />
          </button>
        ) : null,
      )}
    </div>
  )
}
