import { createClient } from '@sanity/client'
import { fetchCatalogue, syncCatalogue } from '../src/catalogue-sync.ts'
import { required } from './env.ts'

/**
 * Runs the catalogue sync by hand, against the dataset in the environment:
 * how a local dataset gets its mirror. Production also runs it daily as the
 * `catalogue-sync` Function.
 *
 * Run with `pnpm --filter @repo/sanity sync`.
 */

export { categoryId } from '../src/catalogue-sync.ts'

export async function syncFromApi() {
  const client = createClient({
    projectId: required('NEXT_PUBLIC_SANITY_PROJECT_ID'),
    dataset: required('NEXT_PUBLIC_SANITY_DATASET'),
    token: required('SANITY_API_WRITE_TOKEN'),
    apiVersion: '2026-09-01',
    useCdn: false,
  })
  const catalogue = await fetchCatalogue({
    baseUrl: required('API_BASE_URL'),
    bypassToken: required('API_BYPASS_TOKEN'),
  })
  const result = await syncCatalogue(client, catalogue)
  return { ...result, categories: catalogue.categories.length, products: catalogue.products.length }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await syncFromApi()
  console.log(
    `API: ${result.categories} categories, ${result.products} products. ` +
      `Created ${result.created}, updated ${result.updated}, flagged ${result.flagged} as gone from the API.`,
  )
}
