/**
 * Heading, one line of text, and whatever comes after (links, buttons,
 * chips). The frame the cart and the search results share. With `headingId`
 * the heading can take focus from script, for a view that replaces the
 * element that had it.
 */
export function EmptyState({
  title,
  description,
  children,
  headingId,
}: {
  title: string
  headingId?: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-6 py-6">
      <div className="flex flex-col gap-2">
        <h2
          id={headingId}
          tabIndex={headingId ? -1 : undefined}
          className="text-xl font-medium tracking-tight text-balance outline-none"
        >
          {title}
        </h2>
        {description ? <p className="text-fg-secondary">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}
