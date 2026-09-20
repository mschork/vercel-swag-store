'use client'

import { useEffect, useRef } from 'react'

/**
 * The chips' scrolling row. Its one job beyond markup: on a phone the row
 * scrolls sideways, and a category far down the list would open with its own
 * chip out of sight, so the row is moved to the current chip once, without
 * animation and without touching the page's own scroll. Without JavaScript the
 * row starts at "All" and the heading still names the category.
 */
export function ChipRow({ children }: { children: React.ReactNode }) {
  const row = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const list = row.current
    const current = list?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!list || !current) return
    const centred = current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2
    list.scrollLeft = Math.max(0, centred)
  }, [])
  return (
    <ul
      ref={row}
      className="relative -m-1 flex gap-2 overflow-x-auto p-1 md:flex-wrap md:overflow-visible"
    >
      {children}
    </ul>
  )
}
