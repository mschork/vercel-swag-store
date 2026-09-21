import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { media } from 'sanity-plugin-media'
import { presentationTool } from 'sanity/presentation'
import { structureTool } from 'sanity/structure'
import { CREATABLE_TYPES, schemaTypes } from '@repo/sanity'
import { requireSanityEnv } from '@repo/sanity/env'
import { guardActions } from './actions/guard-rails'
import { AcceptIdea, RejectIdea } from './actions/idea-decision'
import { resolve } from './presentation/resolve'
import { structure } from './structure'

const { projectId, dataset } = requireSanityEnv({
  projectId: {
    name: 'SANITY_STUDIO_PROJECT_ID',
    value: process.env.SANITY_STUDIO_PROJECT_ID,
  },
  dataset: {
    name: 'SANITY_STUDIO_DATASET',
    value: process.env.SANITY_STUDIO_DATASET,
  },
})

/**
 * The store the Presentation tool frames. Always the production store, or
 * `http://localhost:3000` for a local run: a Vercel preview deployment answers
 * with a login redirect and cannot be framed.
 */
const previewOrigin =
  process.env.SANITY_STUDIO_PREVIEW_ORIGIN || 'https://vercel-swag-store-ms.vercel.app'

export default defineConfig({
  name: 'default',
  title: 'Vercel Swag Store',
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
    presentationTool({
      previewUrl: { origin: previewOrigin, previewMode: { enable: '/api/draft-mode/enable' } },
      resolve,
    }),
    media(),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    // Products and categories are written by the sync script, and the three
    // pages exist once, so the create menu offers only what an editor makes.
    newDocumentOptions: (previous) =>
      previous.filter((item) =>
        CREATABLE_TYPES.includes(item.templateId as (typeof CREATABLE_TYPES)[number]),
      ),
    // A product idea is decided, not edited: Accept and Reject replace publish
    // and the rest. Delete stays, for an idea nobody wants to keep.
    actions: (previous, context) =>
      context.schemaType === 'productIdea'
        ? [AcceptIdea, RejectIdea, ...previous.filter((action) => action.action === 'delete')]
        : guardActions(previous, context),
  },
})
