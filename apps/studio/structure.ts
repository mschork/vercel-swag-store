import type { StructureResolver } from 'sanity/structure'
import { SINGLETON_IDS } from '@repo/sanity'
import { ANALYSE_THRESHOLD } from '@repo/demand/constants'

const API_VERSION = '2026-09-01'

/**
 * The desk (E08). Editorial work first: the three pages that exist once, then
 * products, questions and the lookbook. Categories come last, because they
 * mirror the API and nobody edits them. Demand signals close the list: what
 * the search-gap loop (E13) recorded and proposed, for reading and deciding.
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
      S.divider(),
      S.listItem()
        .title('Demand signals')
        .id('demandSignals')
        .child(
          S.list()
            .title('Demand signals')
            .items([
              S.listItem()
                .title('Search gaps')
                .id('searchGapsOpen')
                .child(
                  S.documentList()
                    .title('Search gaps')
                    .apiVersion(API_VERSION)
                    .filter('_type == "searchGap" && status == "new" && count >= $threshold')
                    .params({ threshold: ANALYSE_THRESHOLD })
                    .defaultOrdering([{ field: 'count', direction: 'desc' }]),
                ),
              S.listItem()
                .title('All gaps')
                .id('searchGapsAll')
                .child(
                  S.documentList()
                    .title('All gaps')
                    .apiVersion(API_VERSION)
                    .filter('_type == "searchGap"')
                    .defaultOrdering([{ field: 'lastSeen', direction: 'desc' }]),
                ),
              S.divider(),
              S.listItem()
                .title('Product ideas')
                .id('productIdeasProposed')
                .child(
                  S.documentList()
                    .title('Product ideas')
                    .apiVersion(API_VERSION)
                    .filter('_type == "productIdea" && status == "proposed"')
                    .defaultOrdering([{ field: 'estimatedDemand', direction: 'desc' }]),
                ),
              S.listItem()
                .title('Decided ideas')
                .id('productIdeasDecided')
                .child(
                  S.documentList()
                    .title('Decided ideas')
                    .apiVersion(API_VERSION)
                    .filter('_type == "productIdea" && status != "proposed"')
                    .defaultOrdering([{ field: 'generatedAt', direction: 'desc' }]),
                ),
            ]),
        ),
    ])
