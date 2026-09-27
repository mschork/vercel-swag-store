import Image from 'next/image'
import { sanityImageProps } from '@/lib/sanity/image'
import type { TestimonialsForProductQueryResult } from '@repo/sanity/generated'

/** The parts of a testimonial every layout shows, whichever query read it. */
export type TestimonialEntry = Pick<
  TestimonialsForProductQueryResult[number],
  'person' | 'role' | 'photo'
>

/**
 * What the person said, in guillemets rather than straight quotes, with a
 * no-break space inside each mark as French typography sets them.
 */
export function Quote({ children, className }: { children: string; className?: string }) {
  return (
    <blockquote className={`italic text-pretty ${className ?? ''}`}>
      &laquo;&#8239;{children}&#8239;&raquo;
    </blockquote>
  )
}

/** Who is in the photo and what they do, under the quote in every layout. */
export function Attribution({ entry }: { entry: TestimonialEntry }) {
  return (
    <p className="text-sm text-fg-secondary">
      {entry.person}
      {entry.role ? `, ${entry.role}` : ''}
    </p>
  )
}

export function EntryPhoto({
  entry,
  sizes,
  preload = false,
}: {
  entry: TestimonialEntry
  sizes: string
  preload?: boolean
}) {
  if (!entry.photo) return null
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-bg-secondary">
      <Image
        {...sanityImageProps(entry.photo, { width: 800 })}
        alt={entry.photo.alt ?? entry.person}
        fill
        sizes={sizes}
        preload={preload}
        className="object-cover"
      />
    </div>
  )
}
