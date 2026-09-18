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
})
