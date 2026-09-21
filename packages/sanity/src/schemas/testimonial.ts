import { CommentIcon } from '@sanity/icons/Comment'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { imageField } from './shared'

/**
 * What one person says about the products they are photographed with
 * (CONTEXT.md): a name, a photo and a quote, shown on the page of each product
 * it names. Publishing needs consent on record: the photo is of a real person,
 * and nothing enforces that but this.
 */
export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  icon: CommentIcon,
  fields: [
    defineField({
      name: 'person',
      title: 'Person',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    imageField({ name: 'photo', title: 'Photo' }),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(240),
    }),
    defineField({
      name: 'products',
      title: 'Products in the photo',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'product' }] })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'consent',
      title: 'Consent on record',
      type: 'boolean',
      description: 'The person agreed to appear on the store. Required to publish.',
      initialValue: false,
      validation: (rule) =>
        rule.custom((value) =>
          value === true ? true : 'This entry cannot be published without consent.',
        ),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  orderings: [
    {
      name: 'newest',
      title: 'Newest first',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'person', subtitle: 'role', media: 'photo', consent: 'consent' },
    prepare: ({ title, subtitle, media, consent }) => ({
      title: String(title ?? ''),
      subtitle: consent ? String(subtitle ?? '') : 'No consent yet',
      media,
    }),
  },
})
