import Image from 'next/image'
import { PortableText } from '@/components/portable-text'
import type { ProductFaq } from '@/lib/sanity/faqs'
import { sanityImageProps } from '@/lib/sanity/image'
import type { MergedProduct } from '@/lib/sanity/merge'
import type { LookbookForProductQueryResult } from '@repo/sanity/generated'

/**
 * What an editor adds to a product page (E09). Every block renders only when
 * it has content, so a product nobody has touched looks exactly as it did
 * before Sanity existed. Each block lines up with the two columns above it:
 * heading on the left, content on the right.
 */

/**
 * One block below the buy row. The rule spans the page and the content sits in
 * the same two columns as the gallery and the buy panel above it: the heading
 * on the left, the words on the right, so the text starts where the price does.
 * Below the medium breakpoint it stacks, heading first.
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-border pt-6 md:grid-cols-2 md:gap-12">
      <h2 className="text-xl font-medium tracking-tight">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

type RichText = NonNullable<MergedProduct['extendedDescription']>

/** A heading beside an editor's rich text; nothing at all when there is no text. */
function RichTextSection({ text, heading }: { text: RichText | null | undefined; heading: string }) {
  if (!text) return null
  return (
    <Section title={heading}>
      <PortableText value={text} />
    </Section>
  )
}

/** What the product is, in the editor's words (`product.extendedDescription`). */
export function About(props: { text: RichText | null | undefined; heading: string }) {
  return <RichTextSection {...props} />
}

/** How to use it and keep it (`product.care`). */
export function Care(props: { text: RichText | null | undefined; heading: string }) {
  return <RichTextSection {...props} />
}

type LookbookEntry = LookbookForProductQueryResult[number]

/**
 * What the person said, in guillemets rather than straight quotes, with a
 * no-break space inside each mark as French typography sets them.
 */
function Quote({ children, className }: { children: string; className?: string }) {
  return (
    <blockquote className={`italic text-pretty ${className ?? ''}`}>
      &laquo;&#8239;{children}&#8239;&raquo;
    </blockquote>
  )
}

/** Who is in the photo and what they do, under the quote in both layouts. */
function Attribution({ entry }: { entry: LookbookEntry }) {
  return (
    <p className="text-sm text-fg-secondary">
      {entry.person}
      {entry.role ? `, ${entry.role}` : ''}
    </p>
  )
}

function EntryPhoto({ entry, sizes }: { entry: LookbookEntry; sizes: string }) {
  if (!entry.photo) return null
  return (
    <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-bg-secondary">
      <Image
        {...sanityImageProps(entry.photo, { width: 800 })}
        alt={entry.photo.alt ?? entry.person}
        fill
        sizes={sizes}
        className="object-cover"
      />
    </div>
  )
}

/** How many entries follow the feature. Five on the page at most, newest first. */
const MAX_LOOKBOOK_ROW = 4

/**
 * One entry across the full width: a photo filling one column, the quote at
 * the foot of the other. The feature has its photo on the right and its words
 * ranged right against it; mirrored, the photo leads and the words stay ranged
 * left, so either way the quote sits against the picture it belongs to.
 */
function WideEntry({ entry, mirrored = false }: { entry: LookbookEntry; mirrored?: boolean }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 md:gap-12">
      <div className={`flex flex-col gap-2 md:justify-end ${mirrored ? '' : 'md:text-right'}`}>
        {entry.quote ? (
          <Quote className="text-xl leading-9 sm:text-2xl sm:leading-10">{entry.quote}</Quote>
        ) : null}
        <Attribution entry={entry} />
      </div>
      {/* Stacked, every entry reads words then photo; only the columns swap. */}
      <div className={mirrored ? 'md:order-first' : undefined}>
        <EntryPhoto entry={entry} sizes="(min-width: 768px) 45vw, 90vw" />
      </div>
    </div>
  )
}

/**
 * Two entries, one per half of the page: the photo on the left at the size a
 * card's photo has, the words beside it at its foot. The gaps match the card
 * grid's, which is what makes the photos come out the same size.
 */
function EntryPair({ entries }: { entries: readonly LookbookEntry[] }) {
  return (
    <ul className="mt-3 grid gap-6 md:grid-cols-2">
      {entries.map((entry) => (
        <li key={entry._id} className="grid grid-cols-2 gap-6">
          <EntryPhoto entry={entry} sizes="(min-width: 768px) 22vw, 45vw" />
          <div className="flex flex-col justify-end gap-1">
            {entry.quote ? <Quote>{entry.quote}</Quote> : null}
            <Attribution entry={entry} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Three or four entries: cards, the photo with the words underneath. */
function EntryCards({ entries }: { entries: readonly LookbookEntry[] }) {
  return (
    <ul className="mt-3 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
      {entries.map((entry) => (
        <li key={entry._id} className="flex flex-col gap-3">
          <EntryPhoto entry={entry} sizes="(min-width: 768px) 22vw, (min-width: 640px) 45vw, 90vw" />
          <div className="flex flex-col gap-1">
            {entry.quote ? <Quote className="text-sm">{entry.quote}</Quote> : null}
            <Attribution entry={entry} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Lookbook entries naming this product, newest first, under a heading the site
 * settings own (`siteSettings.productPage.lookbookHeading`).
 *
 * The newest entry is the feature. What follows depends on how many there are,
 * so the second row always spans the page instead of trailing off to the left:
 * one is the feature mirrored, two take a half each, three or four are cards.
 * Beyond five, the rest wait for their turn as newer entries push them along.
 */
export function Lookbook({
  entries,
  heading,
}: {
  entries: LookbookForProductQueryResult
  heading: string
}) {
  const [feature, ...rest] = entries
  if (!feature) return null
  const row = rest.slice(0, MAX_LOOKBOOK_ROW)
  const [second] = row
  return (
    <section className="flex flex-col gap-5 border-t border-border pt-6">
      <h2 className="text-xl font-medium tracking-tight">{heading}</h2>
      <WideEntry entry={feature} />
      {row.length === 1 && second ? (
        <div className="mt-3">
          <WideEntry entry={second} mirrored />
        </div>
      ) : row.length === 2 ? (
        <EntryPair entries={row} />
      ) : row.length > 2 ? (
        <EntryCards entries={row} />
      ) : null}
    </section>
  )
}

/** The chevron on a question, pointing down when closed and up when open. */
function Chevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4 shrink-0 text-fg-secondary motion-safe:transition-transform motion-safe:duration-250 group-open:-rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

/**
 * The questions this product answers, from its category and from its own list.
 * Native `details` elements: they open without JavaScript and announce their
 * state to a screen reader on their own. The open and close animate in CSS
 * (`app/globals.css`), where a browser without `::details-content` and anyone
 * asking for less motion simply gets the instant toggle.
 */
export function Faqs({
  faqs,
  heading,
}: {
  faqs: readonly ProductFaq[]
  heading: string
}) {
  if (faqs.length === 0) return null
  return (
    <Section title={heading}>
      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {faqs.map((faq) => (
          <li key={faq._id}>
            <details className="disclosure group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {faq.question}
                <Chevron />
              </summary>
              <div className="pt-2 text-fg-secondary">
                <PortableText value={faq.answer} />
              </div>
            </details>
          </li>
        ))}
      </ul>
    </Section>
  )
}
