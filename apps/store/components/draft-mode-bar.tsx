'use client'

import { usePathname } from 'next/navigation'
import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * "Draft preview · Exit", only when the page is not inside the Studio's
 * iframe: there the Studio is the way out. Whether the window is framed is
 * known only in the browser, so the server and the first paint render nothing.
 * A plain link, because leaving is a full navigation that drops the cookie.
 */
export function DraftModeBar() {
  const framed = useSyncExternalStore(
    subscribe,
    () => window.self !== window.top,
    () => true,
  )
  const pathname = usePathname()
  if (framed) return null
  return (
    <aside
      aria-label="Draft preview"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border-strong bg-bg px-4 py-2 text-sm text-fg shadow-lg"
    >
      <span>Draft preview</span>
      <span aria-hidden="true">·</span>
      <a
        href={`/api/draft-mode/disable?redirect=${encodeURIComponent(pathname)}`}
        className="underline underline-offset-4"
      >
        Exit
      </a>
    </aside>
  )
}
