import { defineArrayMember, defineField, defineType } from 'sanity'
import { GAP_STATUSES, IDEA_STATUSES } from '@repo/demand/constants'

/**
 * The search-gap loop's two documents (specs/E13-search-gap-loop.md). Both are
 * written by machines, under the private ids that `gapId` and `ideaId` build
 * (`packages/demand/src/ids.ts`). Neither type is in the create menu.
 */

const titled = (values: readonly string[]) =>
  values.map((value) => ({ value, title: value.charAt(0).toUpperCase() + value.slice(1) }))

export const searchGap = defineType({
  name: 'searchGap',
  title: 'Search gap',
  type: 'document',
  description:
    'A search that found nothing, counted. Only the tidied-up query is kept: no raw input, nothing about who searched.',
  readOnly: true,
  fields: [
    defineField({ name: 'query', title: 'Query', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'count', title: 'Searches', type: 'number', validation: (rule) => rule.required().min(0) }),
    defineField({ name: 'firstSeen', title: 'First seen', type: 'datetime' }),
    defineField({ name: 'lastSeen', title: 'Last seen', type: 'datetime' }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: titled(GAP_STATUSES), layout: 'radio' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'text',
      rows: 2,
      description: 'Why the analysis matched or ignored this gap.',
    }),
    defineField({ name: 'runId', title: 'Analysis run', type: 'string' }),
  ],
  orderings: [
    { name: 'countDesc', title: 'Most searched', by: [{ field: 'count', direction: 'desc' }] },
    { name: 'lastSeenDesc', title: 'Last seen', by: [{ field: 'lastSeen', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'query', count: 'count', lastSeen: 'lastSeen', status: 'status' },
    prepare: ({ title, count, lastSeen, status }) => ({
      title: String(title ?? ''),
      subtitle: `${Number(count ?? 0)} searches, last ${String(lastSeen ?? '').slice(0, 10)} · ${String(status ?? '')}`,
    }),
  },
})

export const productIdea = defineType({
  name: 'productIdea',
  title: 'Product idea',
  type: 'document',
  description:
    'A product people searched for and did not find, proposed by a model from the search gaps. Accepting it is a signal to whoever owns the catalogue and nothing more: the store cannot create products.',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', readOnly: true, validation: (rule) => rule.required() }),
    defineField({ name: 'rationale', title: 'Rationale', type: 'text', rows: 3, readOnly: true }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: titled(IDEA_STATUSES), layout: 'radio' },
      initialValue: 'proposed',
      // Set by the Accept and Reject actions in the Studio, never by hand, so
      // a rejection always carries its reason and a decision its date.
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'rejectionReason',
      title: 'Reason for rejecting',
      type: 'string',
      readOnly: true,
      hidden: ({ document }) => document?.status !== 'rejected',
    }),
    defineField({
      name: 'suggestedCategory',
      title: 'Suggested category',
      type: 'reference',
      to: [{ type: 'category' }],
      weak: true,
      readOnly: true,
    }),
    defineField({
      name: 'sourceGaps',
      title: 'Searches behind it',
      type: 'array',
      readOnly: true,
      // Weak, so retention can delete a gap an idea still points at.
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'searchGap' }], weak: true })],
    }),
    defineField({
      name: 'estimatedDemand',
      title: 'Estimated demand',
      type: 'number',
      readOnly: true,
      description: 'Failed searches behind this idea when it was written.',
    }),
    defineField({ name: 'decidedAt', title: 'Decided', type: 'datetime', readOnly: true }),
    defineField({ name: 'generatedBy', title: 'Model', type: 'string', readOnly: true }),
    defineField({ name: 'generatedAt', title: 'Generated', type: 'datetime', readOnly: true }),
    defineField({ name: 'runId', title: 'Analysis run', type: 'string', readOnly: true }),
  ],
  orderings: [
    { name: 'generatedAtDesc', title: 'Newest', by: [{ field: 'generatedAt', direction: 'desc' }] },
    { name: 'demandDesc', title: 'Most demand', by: [{ field: 'estimatedDemand', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'title', demand: 'estimatedDemand', status: 'status' },
    prepare: ({ title, demand, status }) => ({
      title: String(title ?? ''),
      subtitle: `${String(status ?? '')} · ${Number(demand ?? 0)} searches`,
    }),
  },
})
