import type { SchemaTypeDefinition } from 'sanity'
import { category } from './category'
import { faq } from './faq'
import { lookbookEntry } from './lookbook-entry'
import { product } from './product'
import { portableText } from './shared'
import { checkoutPage, homePage, siteSettings } from './singletons'

/**
 * Every type the Studio registers (E08). Products and categories mirror the
 * API and are written by `scripts/sync.ts`; the rest is an editor's.
 */
export const schemaTypes: SchemaTypeDefinition[] = [
  portableText,
  siteSettings,
  homePage,
  checkoutPage,
  product,
  category,
  faq,
  lookbookEntry,
]

/** Ids of the documents that exist once, shared by the Studio and the seed. */
export const SINGLETON_IDS = {
  siteSettings: 'siteSettings',
  homePage: 'homePage',
  checkoutPage: 'checkoutPage',
} as const

export type SingletonType = keyof typeof SINGLETON_IDS

/** The types an editor may create from the desk's menu. */
export const CREATABLE_TYPES = ['faq', 'lookbookEntry'] as const
