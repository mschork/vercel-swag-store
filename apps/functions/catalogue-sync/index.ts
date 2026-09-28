import { createClient } from '@sanity/client'
import { scheduledEventHandler } from '@sanity/functions'
import { fetchCatalogue, syncCatalogue } from '@repo/sanity/catalogue-sync'

/**
 * Runs the catalogue sync once a day (specs/E15-catalog-sync.md).
 *
 * A scheduled Function has no project or dataset in its context: the
 * blueprint passes both as env, and the robot token it declares arrives as
 * `context.clientOptions.token`. `API_BASE_URL` and `API_BYPASS_TOKEN` are set
 * with `sanity functions env add`. A failed API request throws before anything
 * is written.
 */
function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`[catalogue-sync] ${name} is not set`)
  return value
}

export const handler = scheduledEventHandler(async ({ context }) => {
  const catalogue = await fetchCatalogue({
    baseUrl: env('API_BASE_URL'),
    bypassToken: env('API_BYPASS_TOKEN'),
  })
  if (context.local) {
    console.log(
      `[catalogue-sync] local run: API has ${catalogue.categories.length} categories and ` +
        `${catalogue.products.length} products; nothing written`,
    )
    return
  }

  const token = context.clientOptions?.token
  if (!token) throw new Error('[catalogue-sync] no robot token in the context')
  const client = createClient({
    projectId: env('SANITY_PROJECT_ID'),
    dataset: env('SANITY_DATASET'),
    token,
    apiVersion: '2026-09-01',
    useCdn: false,
  })
  const result = await syncCatalogue(client, catalogue)
  console.log(
    `[catalogue-sync] created ${result.created}, updated ${result.updated}, ` +
      `flagged ${result.flagged} as gone from the API`,
  )
})
