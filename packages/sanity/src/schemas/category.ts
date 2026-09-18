import { defineField, defineType } from 'sanity'
import { syncedFields } from './shared'

/**
 * A mirror of one API category, written by the sync script
 * (docs/adr/0003-sanity-mirrors-api-products-and-categories.md). It exists so
 * an FAQ can point at a category and a product can be matched to it; nothing
 * here is editable, and the store reads categories from the API.
 */
export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  groups: [{ name: 'catalogue', title: 'From the catalogue', default: true }],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      readOnly: true,
      group: 'catalogue',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'apiSlug',
      title: 'Catalogue slug',
      type: 'string',
      readOnly: true,
      group: 'catalogue',
      validation: (rule) => rule.required(),
    }),
    ...syncedFields,
  ],
  preview: {
    select: { title: 'name', subtitle: 'apiSlug', missing: 'missing' },
    prepare: ({ title, subtitle, missing }) => ({
      title: String(title ?? ''),
      subtitle: missing ? `${String(subtitle ?? '')} — gone from the API` : String(subtitle ?? ''),
    }),
  },
})
