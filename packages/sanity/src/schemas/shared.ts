import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * Field builders shared by the schemas, so every image and every rich text
 * field in the Studio behaves the same way.
 */

/**
 * Rich text as the store renders it: paragraphs, bold, italic and links.
 * Pictures live in the fields built for them, and the store's serializer
 * supports exactly this set.
 */
export const portableText = defineType({
  name: 'richText',
  title: 'Text',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{ title: 'Paragraph', value: 'normal' }],
      lists: [],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
        ],
        annotations: [
          defineArrayMember({
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                title: 'URL',
                type: 'url',
                validation: (rule) =>
                  rule.required().uri({ scheme: ['http', 'https', 'mailto'] }),
              }),
            ],
          }),
        ],
      },
    }),
  ],
})

/**
 * An image with alternative text, which the store needs for every photo it
 * renders, and a hotspot so a crop keeps the subject in frame.
 */
export function imageField(options: {
  name: string
  title: string
  description?: string
  group?: string
}) {
  return defineField({
    ...options,
    type: 'image',
    options: { hotspot: true },
    fields: [
      defineField({
        name: 'alt',
        title: 'Alternative text',
        type: 'string',
        description: 'What the photo shows, for screen readers.',
        validation: (rule) => rule.required(),
      }),
    ],
  })
}

/** Written by the sync script; an editor sees the values but cannot change them. */
export const syncedFields = [
  defineField({
    name: 'syncedAt',
    title: 'Last synced',
    type: 'datetime',
    readOnly: true,
    group: 'catalogue',
  }),
  defineField({
    name: 'missing',
    title: 'No longer in the API',
    type: 'boolean',
    description:
      'The catalogue no longer lists this. Nothing on the site shows it; the document is kept so the words written here are not lost.',
    readOnly: true,
    group: 'catalogue',
  }),
]
