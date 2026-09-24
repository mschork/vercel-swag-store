import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
  },
  // The deployed Studio application, so `sanity deploy` never asks again.
  // With auto-updates the deployed bundle loads the Studio framework from
  // Sanity rather than baking it in, so a fix in a Studio release reaches
  // editors without a deploy. Schema, plugins and local development stay on
  // the version the lockfile pins.
  deployment: {
    appId: 'sb1qmsqaouwxikd4v8rs9xaq',
    autoUpdates: true,
  },
  // The store's queries in, the shared package's types out. Runs only through
  // `pnpm typegen`, so a Studio build never rewrites a file in another package.
  typegen: {
    path: '../store/lib/sanity/**/*.ts',
    schema: '../../packages/sanity/src/generated/schema.json',
    generates: '../../packages/sanity/src/generated/sanity.types.ts',
    overloadClientMethods: false,
  },
})
