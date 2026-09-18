import Image from 'next/image'
import { PortableText } from '@/components/portable-text'
import type { ProductFaq } from '@/lib/sanity/faqs'
import { sanityImageProps } from '@/lib/sanity/image'
import type { MergedProduct } from '@/lib/sanity/merge'
import type { LookbookForProductQueryResult } from '@repo/sanity/generated'

/**
 * What an editor adds to a product page (E09). Every block renders only when
 * it has content, so a product nobody has touched looks exactly as it did
 * before Sanity existed.
 */

/** Badges sit over the photo, where a shopper scanning a grid would see them. */
export function ProductBadges({ badges }: { badges: readonly string[] }) {
  if (badges.length === 0) return null
  return (
    <ul className="absolute top-3 left-3 z-10 flex flex-wrap gap-2">
      {badges.map((badge) => (
        <li
          key={badge}
          className="rounded-full border border-border bg-bg px-2 py-0.5 text-xs font-medium"
        >
          {badge}
        </li>
      ))}
    </ul>
  )
}

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

/** Lookbook entries naming this product: a photo, who is in it and what they said. */
export function SeenOn({ entries }: { entries: LookbookForProductQueryResult }) {
  if (entries.length === 0) return null
  return (
    <Section title="Seen on">
      <ul className="grid gap-6 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry._id} className="flex flex-col gap-3">
            {entry.photo ? (
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-bg-secondary">
                <Image
                  {...sanityImageProps(entry.photo, { width: 800 })}
                  alt={entry.photo.alt ?? entry.person}
                  fill
                  sizes="(min-width: 640px) 45vw, 90vw"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-1">
              {entry.quote ? (
                <blockquote className="text-pretty">&ldquo;{entry.quote}&rdquo;</blockquote>
              ) : null}
              <p className="text-sm text-fg-secondary">
                {entry.person}
                {entry.role ? `, ${entry.role}` : ''}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  )
}

/**
 * The questions this product answers, from its category and from its own list.
 * Native `details` elements: they open without JavaScript and announce their
 * state to a screen reader on their own.
 */
export function CommonQuestions({ faqs }: { faqs: readonly ProductFaq[] }) {
  if (faqs.length === 0) return null
  return (
    <Section title="Common questions">
      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {faqs.map((faq) => (
          <li key={faq._id}>
            <details className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="text-fg-secondary transition-transform group-open:rotate-45"
                >
                  +
                </span>
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
