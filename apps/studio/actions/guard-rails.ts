import type { DocumentActionComponent, DocumentActionsContext } from 'sanity'
import { SINGLETON_IDS } from '@repo/sanity'

const SINGLETON_TYPES: readonly string[] = Object.keys(SINGLETON_IDS)

/** The types `scripts/sync.ts` writes under ids built from the API's. */
const MIRROR_TYPES: readonly string[] = ['product', 'category']

/** Actions that would leave the store without a page it reads by fixed id. */
const NOT_FOR_SINGLETONS: readonly string[] = ['duplicate', 'delete', 'unpublish']

/**
 * Delete, offered only once the sync has marked the mirror `missing`. The
 * stock action runs on every render because it uses hooks.
 */
function deleteWhenMissing(stock: DocumentActionComponent): DocumentActionComponent {
  const guarded: DocumentActionComponent = (props) => {
    const description = stock(props)
    return (props.published ?? props.draft)?.missing === true ? description : null
  }
  guarded.action = 'delete'
  return guarded
}

/**
 * Removes the actions that break what the store relies on: a page that exists
 * once keeps its one document, and a mirror is never duplicated, because the
 * copy shares its `apiId` under an id the sync does not know.
 */
export function guardActions(
  previous: DocumentActionComponent[],
  { schemaType }: DocumentActionsContext,
): DocumentActionComponent[] {
  if (SINGLETON_TYPES.includes(schemaType)) {
    return previous.filter((action) => !NOT_FOR_SINGLETONS.includes(action.action ?? ''))
  }
  if (MIRROR_TYPES.includes(schemaType)) {
    return previous
      .filter((action) => action.action !== 'duplicate')
      .map((action) => (action.action === 'delete' ? deleteWhenMissing(action) : action))
  }
  return previous
}
