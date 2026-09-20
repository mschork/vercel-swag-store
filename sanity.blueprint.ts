import { readFileSync } from 'node:fs'
import { defineBlueprint, defineDocumentFunction } from '@sanity/blueprints'
import { ANALYSE_THRESHOLD } from './packages/demand/src/constants.ts'

/**
 * Everything Sanity runs for this repo, declared in code. It sits at the repo
 * root beside the lockfile, which is where Blueprints looks in a pnpm
 * monorepo. Preview with `sanity blueprints plan`, apply with
 * `sanity blueprints deploy`.
 *
 * No secret belongs in this file. A Function's secrets are set after the
 * first deploy with `sanity functions env add <function> <KEY> <value>`.
 */

/**
 * The project id is public: it is in every page's image URLs. It comes from
 * the env or the Studio's .env.
 */
function projectId(): string {
  const fromEnv = process.env.SANITY_STUDIO_PROJECT_ID
  if (fromEnv) return fromEnv
  try {
    const match = /^SANITY_STUDIO_PROJECT_ID=["']?([a-z0-9]+)/m.exec(readFileSync('apps/studio/.env', 'utf8'))
    if (match?.[1]) return match[1]
  } catch {
    // Fall through to the error below.
  }
  throw new Error('Set SANITY_STUDIO_PROJECT_ID, or put it in apps/studio/.env.')
}

const project = projectId()
const production = { type: 'dataset' as const, id: `${project}.production` }

export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: 'gap-threshold',
      src: './apps/functions/gap-threshold',
      // The stack is organisation-scoped (scheduled Functions need that), so
      // each Function names its project.
      project,
      timeout: 15,
      event: {
        on: ['update'],
        resource: production,
        filter: `_type == 'searchGap' && status == 'new' && count >= ${ANALYSE_THRESHOLD} && delta::changedAny(count)`,
        projection: '{_id}',
      },
    }),
    // The Function's own write leaves `status` alone, so it cannot re-fire.
    defineDocumentFunction({
      name: 'idea-decided',
      src: './apps/functions/idea-decided',
      project,
      timeout: 15,
      event: {
        on: ['update'],
        resource: production,
        filter: `_type == 'productIdea' && status in ['accepted', 'rejected'] && delta::changedAny(status)`,
        projection: '{_id, status}',
      },
    }),
  ],
})
