import type { StructureResolver } from 'sanity/structure'
import { SINGLETON_IDS } from '@repo/sanity'

/**
 * The desk (E08). Editorial work first: the three pages that exist once, then
 * products, questions and the lookbook. Categories come last, because they
 * mirror the API and nobody edits them.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId(SINGLETON_IDS.siteSettings)),
      S.listItem()
        .title('Home page')
        .id('homePage')
        .child(S.document().schemaType('homePage').documentId(SINGLETON_IDS.homePage)),
      S.listItem()
        .title('Checkout page')
        .id('checkoutPage')
        .child(S.document().schemaType('checkoutPage').documentId(SINGLETON_IDS.checkoutPage)),
      S.divider(),
      S.documentTypeListItem('product').title('Products'),
      S.documentTypeListItem('faq').title('FAQs'),
      S.documentTypeListItem('lookbookEntry').title('Lookbook'),
      S.divider(),
      S.documentTypeListItem('category').title('Categories'),
    ])
