import {
  PortableText as PortableTextRenderer,
  type PortableTextComponents,
} from '@portabletext/react'
import Link from 'next/link'

/**
 * Sanity rich text as the store renders it. The schema allows paragraphs,
 * bold, italic and links (E08), and this renders exactly that set: anything
 * else an editor smuggles in through the API is ignored rather than rendered
 * as raw markup.
 *
 * Internal links use `Link` so they navigate on the client; external ones get
 * the usual safety attributes.
 *
 * The paragraphs take the width they are given: whoever renders the text owns
 * its measure, so a heading or a rule beside it is never wider than the text.
 */
const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="leading-7">{children}</p>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-medium">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ value, children }) => {
      const href = typeof value?.href === 'string' ? value.href : ''
      const internal = href.startsWith('/')
      const className = 'underline underline-offset-4'
      if (internal) {
        return (
          <Link href={href as '/'} className={className}>
            {children}
          </Link>
        )
      }
      return (
        <a href={href} className={className} rel="noopener noreferrer" target="_blank">
          {children}
        </a>
      )
    },
  },
}

export function PortableText({ value }: { value: unknown }) {
  if (!Array.isArray(value) || value.length === 0) return null
  return (
    <div className="flex flex-col gap-3">
      <PortableTextRenderer value={value} components={components} />
    </div>
  )
}
