import { defineField, defineType } from 'sanity'
import { syncedFields } from './shared'

/**
 * A mirror of one API category, written by the sync script
 * (docs/adr/0003-sanity-mirrors-api-products-and-categories.md), plus the one
 * thing an editor writes: the intro for the category's product listing.
 * The mirror lets an FAQ point at a category and a product be matched to it;
 * the store still reads every catalogue fact from the API.
 */
export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  groups: [
    { name: 'listing', title: 'Listing page', default: true },
    { name: 'catalogue', title: 'From the catalogue' },
  ],
  fields: [
    defineField({
      name: 'intro',
      title: 'Intro',
      description:
        "One or two sentences under the heading of this category's page. Also used as the page's description for search engines.",
      type: 'text',
      rows: 2,
      group: 'listing',
      validation: (rule) => rule.max(200),
    }),
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
