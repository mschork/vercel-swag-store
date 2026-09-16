/**
 * Heading, one line of text, and whatever comes after (links, buttons,
 * chips). The frame the cart and the search results share (E10).
 */
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-6 py-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-medium tracking-tight">{title}</h2>
        {description ? <p className="text-fg-secondary">{description}</p> : null}
      </div>
      {children}
    </div>
  )
}
