import { HelpCircleIcon } from '@sanity/icons/HelpCircle'
import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * One question and its answer, written once and shown on many products
 * (CONTEXT.md). It reaches a product through the categories it names, or
 * because that product attaches it directly. With no categories it appears
 * only where a product attaches it.
 */
export const faq = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  icon: HelpCircleIcon,
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      validation: (rule) => rule.required().max(120),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'richText',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
      description: 'Lowest first, among the questions shown on a product.',
      initialValue: 100,
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      description:
        'Every product in these categories shows this answer. Leave empty to show it only on the products that attach it themselves.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })],
    }),
  ],
  orderings: [
    {
      name: 'order',
      title: 'Order',
      by: [
        { field: 'order', direction: 'asc' },
        { field: 'question', direction: 'asc' },
      ],
    },
  ],
  preview: {
    select: {
      title: 'question',
      order: 'order',
      first: 'categories.0.name',
      count: 'categories.length',
    },
    prepare: ({ title, order, first, count }) => {
      const scope =
        typeof count === 'number' && count > 0
          ? `${String(first ?? '')}${count > 1 ? ` +${count - 1}` : ''}`
          : 'Attached products only'
      return { title: String(title ?? ''), subtitle: `${String(order ?? '')} · ${scope}` }
    },
  },
})
