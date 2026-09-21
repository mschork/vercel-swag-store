import { PackageIcon } from '@sanity/icons/Package'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { imageField, syncedFields } from './shared'

/**
 * One product, mirrored from the API and enriched by an editor
 * (docs/adr/0003-sanity-mirrors-api-products-and-categories.md). The
 * catalogue fields are written by the sync script and read only: the store
 * takes name, price, category and the rest from the API, so a change here
 * would be invisible. Everything in the Enrichment tab is the editor's, and
 * every field of it is optional: a product with none renders from the API
 * alone.
 */
/** The API's photo, filling the square a list row gives its media. */
function CataloguePhoto({ src }: { src: string }) {
  return <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
}

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: PackageIcon,
  groups: [
    { name: 'editorial', title: 'Enrichment', default: true },
    { name: 'catalogue', title: 'From the catalogue' },
  ],
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
      name: 'apiId',
      title: 'Catalogue id',
      type: 'string',
      readOnly: true,
      group: 'catalogue',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'string',
      readOnly: true,
      group: 'catalogue',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      readOnly: true,
      group: 'catalogue',
    }),
    defineField({
      name: 'price',
      title: 'Price in cents',
      type: 'number',
      readOnly: true,
      group: 'catalogue',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      readOnly: true,
      group: 'catalogue',
    }),
    defineField({
      name: 'image',
      title: 'Catalogue photo',
      type: 'url',
      description: 'The API’s photo, shown here so the document is recognisable.',
      readOnly: true,
      group: 'catalogue',
    }),
    ...syncedFields,
    defineField({
      name: 'extendedDescription',
      title: 'About this item',
      type: 'richText',
      description: 'The longer story, below the API’s own description.',
      group: 'editorial',
    }),
    defineField({
      name: 'care',
      title: 'How to use and care',
      type: 'richText',
      group: 'editorial',
    }),
    defineField({
      name: 'gallery',
      title: 'Extra photos',
      type: 'array',
      description: 'Shown after the catalogue photo, in this order.',
      of: [imageField({ name: 'photo', title: 'Photo' })],
      group: 'editorial',
    }),
    defineField({
      name: 'faqs',
      title: 'Questions for this product',
      type: 'array',
      description:
        'Shown alongside the questions this product’s category already answers.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'faq' }] })],
      group: 'editorial',
    }),
  ],
  orderings: [
    { name: 'name', title: 'Name', by: [{ field: 'name', direction: 'asc' }] },
    { name: 'priceAsc', title: 'Price, lowest first', by: [{ field: 'price', direction: 'asc' }] },
    { name: 'priceDesc', title: 'Price, highest first', by: [{ field: 'price', direction: 'desc' }] },
    { name: 'syncedAt', title: 'Last synced', by: [{ field: 'syncedAt', direction: 'desc' }] },
  ],
  preview: {
    select: {
      title: 'name',
      category: 'category.name',
      image: 'image',
      missing: 'missing',
      enriched: 'extendedDescription',
    },
    prepare: ({ title, category, image, missing, enriched }) => ({
      title: String(title ?? ''),
      // The photo is the API's, by URL, so the Studio cannot draw it itself.
      media: typeof image === 'string' ? <CataloguePhoto src={image} /> : undefined,
      subtitle: [
        String(category ?? 'No category'),
        enriched ? 'enriched' : 'not enriched yet',
        missing ? 'gone from the API' : null,
      ]
        .filter(Boolean)
        .join(' · '),
    }),
  },
})
