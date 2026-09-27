import { InboxIcon } from '@sanity/icons/Inbox'
import { defineArrayMember, defineField, defineType, type StringInputProps } from 'sanity'
import {
  PRODUCT_SOURCES,
  QUALITY_ISSUES,
  REJECTION_REASONS,
  SUBMISSION_STATUSES,
  SUBMISSION_TYPE,
} from '@repo/testimonials/constants'

/**
 * What a visitor sends through the testimonial agent
 * (specs/E25-testimonial-agent.md), written by the run under the private id
 * `testimonialSubmission.<runId>`. Every field is read only: the Accept and
 * Reject actions set `status`, `rejectionReason` and `photoAlt`. Not in the
 * create menu.
 */

const titled = (values: readonly string[]) =>
  values.map((value) => ({ value, title: value.charAt(0).toUpperCase() + value.slice(1) }))

/**
 * The photo, from the store's signed route: it stays in private Blob until an
 * editor accepts it, so there is no Sanity asset to show.
 */
function PhotoPreviewInput({ value }: StringInputProps) {
  if (!value) return <p style={{ margin: 0 }}>The photo is gone: the submission has been decided.</p>
  return (
    <a href={value} target="_blank" rel="noreferrer">
      <img
        src={value}
        alt="The submitted photo"
        style={{ display: 'block', maxWidth: '100%', maxHeight: 480, borderRadius: 4 }}
      />
    </a>
  )
}

function PreviewPhoto({ src }: { src: string }) {
  return <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
}

export const testimonialSubmission = defineType({
  name: SUBMISSION_TYPE,
  title: 'Testimonial submission',
  type: 'document',
  icon: InboxIcon,
  description:
    'A testimonial a visitor sent through the store’s agent. Accept publishes it as a testimonial; either decision emails the visitor.',
  readOnly: true,
  fields: [
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: titled(SUBMISSION_STATUSES), layout: 'radio' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'rejectionReason',
      title: 'Reason for rejecting',
      type: 'string',
      options: { list: titled(REJECTION_REASONS) },
      hidden: ({ document }) => document?.status !== 'rejected',
    }),
    defineField({
      name: 'photoUrl',
      title: 'Photo',
      type: 'url',
      components: { input: PhotoPreviewInput },
    }),
    defineField({ name: 'photoAlt', title: 'Alternative text', type: 'string' }),
    defineField({ name: 'person', title: 'Person', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'quote', title: 'Quote', type: 'text', rows: 3, validation: (rule) => rule.required() }),
    defineField({
      name: 'products',
      title: 'Products in the photo',
      type: 'array',
      // Weak, so a rejected submission never blocks deleting a mirror.
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'product' }], weak: true })],
    }),
    defineField({
      name: 'productSource',
      title: 'Product named by',
      type: 'string',
      options: {
        list: [
          { value: PRODUCT_SOURCES[0], title: 'The agent, confirmed by the visitor' },
          { value: PRODUCT_SOURCES[1], title: 'The visitor' },
        ],
      },
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      description: 'Verified by code. Removed once the outcome email is sent; never published.',
      hidden: ({ value }) => !value,
    }),
    defineField({
      name: 'findings',
      title: 'Findings',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'qualityScore', title: 'Photo quality', type: 'number' }),
        defineField({
          name: 'qualityIssues',
          title: 'Photo issues',
          type: 'array',
          of: [defineArrayMember({ type: 'string' })],
          options: { list: titled(QUALITY_ISSUES) },
        }),
        defineField({ name: 'markVisible', title: 'Mark visible', type: 'boolean' }),
        defineField({
          name: 'candidates',
          title: 'Candidates',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'candidate',
              fields: [
                defineField({ name: 'id', title: 'Catalogue id', type: 'string' }),
                defineField({ name: 'confidence', title: 'Confidence', type: 'number' }),
              ],
              preview: {
                select: { title: 'id', confidence: 'confidence' },
                prepare: ({ title, confidence }) => ({
                  title: String(title ?? ''),
                  subtitle: `confidence ${Number(confidence ?? 0).toFixed(2)}`,
                }),
              },
            }),
          ],
        }),
        defineField({ name: 'productSource', title: 'Product named by', type: 'string' }),
        defineField({
          name: 'textCheck',
          title: 'Text check',
          type: 'object',
          fields: [
            defineField({ name: 'nameOk', title: 'Name passed', type: 'boolean' }),
            defineField({ name: 'quoteOk', title: 'Quote passed', type: 'boolean' }),
            defineField({ name: 'altTextOk', title: 'Alt text passed', type: 'boolean' }),
          ],
        }),
        defineField({ name: 'model', title: 'Model', type: 'string' }),
      ],
    }),
    defineField({ name: 'consentGiven', title: 'Consent given', type: 'boolean' }),
    defineField({ name: 'submittedAt', title: 'Submitted', type: 'datetime' }),
    defineField({ name: 'decidedAt', title: 'Decided', type: 'datetime' }),
    defineField({ name: 'runId', title: 'Workflow run', type: 'string' }),
  ],
  orderings: [
    { name: 'submittedAtAsc', title: 'Oldest first', by: [{ field: 'submittedAt', direction: 'asc' }] },
    { name: 'decidedAtDesc', title: 'Recently decided', by: [{ field: 'decidedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'person', quote: 'quote', status: 'status', photoUrl: 'photoUrl' },
    prepare: ({ title, quote, status, photoUrl }) => ({
      title: String(title ?? ''),
      subtitle: `${String(status ?? '')} · ${String(quote ?? '')}`,
      media: typeof photoUrl === 'string' ? <PreviewPhoto src={photoUrl} /> : undefined,
    }),
  },
})
