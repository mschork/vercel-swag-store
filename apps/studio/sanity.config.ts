import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from '@repo/sanity'
import { requireSanityEnv } from '@repo/sanity/env'

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

export default defineConfig({
  name: 'default',
  title: 'Vercel Swag Store',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
})
