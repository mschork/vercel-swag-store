import Image from 'next/image'
import { PortableText } from '@/components/portable-text'
import type { ProductFaq } from '@/lib/sanity/faqs'
import { sanityImageProps } from '@/lib/sanity/image'
import type { MergedProduct } from '@/lib/sanity/merge'
import type { LookbookForProductQueryResult } from '@repo/sanity/generated'

/**
 * What an editor adds to a product page (E09). Every block renders only when
 * it has content, so a product nobody has touched looks exactly as it did
 * before Sanity existed. The page gives this stack one readable column; the
 * blocks fill whatever width they are given.
 */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-6">
      <h2 className="text-xl font-medium tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

/** The two rich text blocks, in the order they belong: what it is, then how to keep it. */
export function ProductStory({ product }: { product: MergedProduct }) {
  return (
    <>
      {product.extendedDescription ? (
        <Section title="About this item">
          <PortableText value={product.extendedDescription} />
        </Section>
      ) : null}
      {product.care ? (
        <Section title="How to use and care">
          <PortableText value={product.care} />
        </Section>
      ) : null}
    </>
  )
}

type LookbookEntry = LookbookForProductQueryResult[number]

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

/**
 * Lookbook entries naming this product. One entry is a feature row, photo on
 * the right so it does not sit under the product photo, with the quote given
 * the room a single quote deserves. Two or more fall back to a grid, where
 * equal weight is the point.
 */
export function SeenOn({ entries }: { entries: LookbookForProductQueryResult }) {
  if (entries.length === 0) return null
  const [only] = entries
  if (entries.length === 1 && only) {
    return (
      <Section title="Seen on">
        <div className="flex flex-col gap-5 sm:flex-row-reverse sm:items-center sm:gap-8">
          <div className="sm:w-2/5 sm:shrink-0">
            <EntryPhoto entry={only} sizes="(min-width: 640px) 30vw, 90vw" />
          </div>
          <div className="flex flex-col gap-2">
            {only.quote ? (
              <blockquote className="text-lg leading-8 text-pretty sm:text-xl sm:leading-9">
                &ldquo;{only.quote}&rdquo;
              </blockquote>
            ) : null}
            <Attribution entry={only} />
          </div>
        </div>
      </Section>
    )
  }
  return (
    <Section title="Seen on">
      <ul className="grid gap-6 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry._id} className="flex flex-col gap-3">
            <EntryPhoto entry={entry} sizes="(min-width: 640px) 45vw, 90vw" />
            <div className="flex flex-col gap-1">
              {entry.quote ? (
                <blockquote className="text-pretty">&ldquo;{entry.quote}&rdquo;</blockquote>
              ) : null}
              <Attribution entry={entry} />
            </div>
          </li>
        ))}
      </ul>
    </Section>
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
export function CommonQuestions({ faqs }: { faqs: readonly ProductFaq[] }) {
  if (faqs.length === 0) return null
  return (
    <Section title="Common questions">
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
