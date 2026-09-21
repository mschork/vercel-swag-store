import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET,
  },
  // The deployed Studio application, so `sanity deploy` never asks again.
  deployment: {
    appId: 'sb1qmsqaouwxikd4v8rs9xaq',
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
