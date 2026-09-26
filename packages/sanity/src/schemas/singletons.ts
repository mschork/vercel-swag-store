import { CogIcon } from '@sanity/icons/Cog'
import { CreditCardIcon } from '@sanity/icons/CreditCard'
import { HomeIcon } from '@sanity/icons/Home'
import { defineArrayMember, defineField, defineType } from 'sanity'
import { imageField } from './shared'

/** The three documents that exist once. Their ids are fixed by the seed script. */

/** Where search results and link previews cut a title and a description. */
const SEO_TITLE_LENGTH = 60
const SEO_DESCRIPTION_LENGTH = 160

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  groups: [
    { name: 'seo', title: 'SEO and sharing', default: true },
    { name: 'chrome', title: 'Header and footer' },
    { name: 'productPage', title: 'Product page' },
    { name: 'productListing', title: 'Product listing' },
    { name: 'cartPage', title: 'Cart page' },
    { name: 'searchPage', title: 'Search page' },
  ],
  fields: [
    defineField({
      name: 'storeName',
      title: 'Store name',
      type: 'string',
      group: 'chrome',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seoTitle',
      title: 'Default page title',
      type: 'string',
      group: 'seo',
      validation: (rule) =>
        rule
          .max(SEO_TITLE_LENGTH)
          .warning(`Search results cut a title after about ${SEO_TITLE_LENGTH} characters.`),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Default description',
      type: 'text',
      rows: 3,
      description: 'Used when a page has none of its own.',
      group: 'seo',
      validation: (rule) =>
        rule
          .max(SEO_DESCRIPTION_LENGTH)
          .warning(
            `Search results cut a description after about ${SEO_DESCRIPTION_LENGTH} characters.`,
          ),
    }),
    imageField({
      name: 'ogImage',
      title: 'Sharing image',
      description: 'Shown when a link to the store is shared. 1200 by 630.',
      group: 'seo',
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'array',
      group: 'chrome',
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
    defineField({ name: 'footerText', title: 'Footer text', type: 'string', group: 'chrome' }),
    defineField({
      name: 'productPage',
      title: 'Product page headings',
      type: 'object',
      group: 'productPage',
      description:
        'The headings above each block on a product page. Leave one empty and the page uses its own wording.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'aboutHeading',
          title: 'Extended description',
          type: 'string',
          description: 'Default: “About this item”.',
        }),
        defineField({
          name: 'careHeading',
          title: 'Care text',
          type: 'string',
          description: 'Default: “How to use and care”.',
        }),
        defineField({
          name: 'testimonialsHeading',
          title: 'Testimonials',
          type: 'string',
          description: 'Default: “What people say about it”.',
        }),
        defineField({
          name: 'faqHeading',
          title: 'Questions',
          type: 'string',
          description: 'Default: “Common questions”.',
        }),
      ],
    }),
    defineField({
      name: 'productListing',
      title: 'Product listing',
      type: 'object',
      group: 'productListing',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'intro',
          title: 'Intro for all products',
          type: 'text',
          rows: 2,
          validation: (rule) =>
            rule.max(SEO_DESCRIPTION_LENGTH).warning('Also the page’s description; keep it short.'),
          description:
            'The line under “All products”, and the page’s description. A category’s own intro is set on the category. Default: “Filter through our great range of swag products.”',
        }),
      ],
    }),
    defineField({
      name: 'cartPage',
      title: 'Cart page',
      type: 'object',
      group: 'cartPage',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'favouritesHeading',
          title: 'Heading over the favourites',
          type: 'string',
          description:
            'Shown above the favourites under the cart, where a tap on a card adds it, so it reads as an invitation. The home page’s row has its own heading. Default: “Add one of our favourites”.',
        }),
      ],
    }),
    defineField({
      name: 'searchPage',
      title: 'Search page',
      type: 'object',
      group: 'searchPage',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'featuredHeading',
          title: 'Heading over the featured products',
          type: 'string',
          description:
            'Shown above the featured products before anything is searched, so they do not read as results. Default: “Explore our featured products”.',
        }),
      ],
    }),
  ],
  preview: { select: { title: 'storeName' } },
})

export const homePage = defineType({
  name: 'homePage',
  title: 'Home page',
  type: 'document',
  icon: HomeIcon,
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
    defineField({
      name: 'favourites',
      title: 'People’s favourites',
      type: 'object',
      description:
        'The products named most often by published testimonials. Ordered by how many name them; nothing to show means no section.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'heading',
          title: 'Heading',
          type: 'string',
          description: 'Default: “People’s favourites”.',
        }),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured grid',
      type: 'object',
      description: 'The heading over the product grid and the link beside it.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'heading',
          title: 'Heading',
          type: 'string',
          description: 'Default: “Featured”.',
        }),
        defineField({
          name: 'linkLabel',
          title: 'Link label',
          type: 'string',
          description: 'Links to search either way. Default: “View all”.',
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
  icon: CreditCardIcon,
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
