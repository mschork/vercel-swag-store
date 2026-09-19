import { defineArrayMember, defineField, defineType } from 'sanity'
import { imageField } from './shared'

/** The three documents that exist once. Their ids are fixed by the seed script. */

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({
      name: 'storeName',
      title: 'Store name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'seoTitle', title: 'Default page title', type: 'string' }),
    defineField({
      name: 'seoDescription',
      title: 'Default description',
      type: 'text',
      rows: 3,
      description: 'Used when a page has none of its own.',
    }),
    imageField({
      name: 'ogImage',
      title: 'Sharing image',
      description: 'Shown when a link to the store is shared. 1200 by 630.',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'array',
      description: 'Replaces the links the API returns when this list has any.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'url' } },
        }),
      ],
    }),
    defineField({ name: 'footerText', title: 'Footer text', type: 'string' }),
    defineField({
      name: 'lookbookHeading',
      title: 'Lookbook heading',
      type: 'string',
      description:
        'Heading above the lookbook entries on a product page. Left empty, the page says “What people say about it”.',
    }),
  ],
  preview: { select: { title: 'storeName' } },
})

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      options: { collapsible: false },
      fields: [
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
          validation: (rule) => rule.max(60),
        }),
        defineField({
          name: 'description',
          title: 'Description',
          type: 'text',
          rows: 3,
          validation: (rule) => rule.max(240),
        }),
        imageField({
          name: 'image',
          title: 'Photo',
          description:
            'Full width behind the copy. Set the hotspot on the subject; the crop changes with the screen.',
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'hero.headline', media: 'hero.image' },
    prepare: ({ title, media }) => ({ title: String(title ?? 'Home page'), media }),
  },
})

export const checkoutPage = defineType({
  name: 'checkoutPage',
  title: 'Checkout page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'body', title: 'Body', type: 'richText' }),
    defineField({
      name: 'continueShoppingLabel',
      title: 'Link back to the store',
      type: 'string',
    }),
  ],
  preview: { select: { title: 'title' } },
})
