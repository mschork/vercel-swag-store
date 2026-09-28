'use client'

import { usePathname } from 'next/navigation'
import { markdownPathFor } from '@/lib/markdown/paths'

/** The footer link to the current page's Markdown version; none on a page without one. */
export function MarkdownLink() {
  const href = markdownPathFor(usePathname())
  if (!href) return null
  return (
    <a
      href={href}
      rel="alternate"
      type="text/markdown"
      className="self-start underline underline-offset-4 hover:text-fg"
    >
      This page for agents
    </a>
  )
}
