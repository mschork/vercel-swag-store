// Version 5 of the icon package exports each icon from its own path.
import { CheckmarkCircleIcon } from '@sanity/icons/CheckmarkCircle'
import { ClockIcon } from '@sanity/icons/Clock'
import { CloseCircleIcon } from '@sanity/icons/CloseCircle'
import { EditIcon } from '@sanity/icons/Edit'
import { UlistIcon } from '@sanity/icons/Ulist'
import type { ComponentType } from 'react'
import type { StructureBuilder, StructureResolver } from 'sanity/structure'
import { ANALYSE_THRESHOLD, type IdeaStatus } from '@repo/demand/constants'
import { SINGLETON_IDS, type SingletonType } from '@repo/sanity'

const API_VERSION = '2026-09-01'

/**
 * The desk, in the order an editor works: what they write every day, with the
 * products that have no extended description yet as their own list, then the
 * three pages that exist once, then the categories that mirror the API and
 * nobody edits, then the search-gap loop's proposals and the gaps behind them.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('product').title('Products'),
      S.listItem()
        .title('Products to enrich')
        .id('productsToEnrich')
        .icon(EditIcon)
        .child(
          S.documentList()
            .title('Products to enrich')
            .schemaType('product')
            .apiVersion(API_VERSION)
            .filter('_type == "product" && missing != true && !defined(extendedDescription)')
            .defaultOrdering([{ field: 'name', direction: 'asc' }]),
        ),
      S.documentTypeListItem('faq').title('FAQs'),
      S.documentTypeListItem('testimonial').title('Testimonials'),

      S.divider().title('Website'),
      singleton(S, 'homePage', 'Home page'),
      singleton(S, 'checkoutPage', 'Checkout page'),
      singleton(S, 'siteSettings', 'Site settings'),

      S.divider().title('Taxonomies'),
      S.documentTypeListItem('category').title('Categories'),

      S.divider().title('Demand signals'),
      S.listItem()
        .title('Product ideas')
        .id('productIdeas')
        .icon(typeIcon(S, 'productIdea'))
        .child(
          S.list()
            .title('Product ideas')
            .items([
              ideas(S, 'proposed', 'Open ideas', ClockIcon, 'estimatedDemand'),
              ideas(S, 'accepted', 'Accepted ideas', CheckmarkCircleIcon, 'decidedAt'),
              ideas(S, 'rejected', 'Rejected ideas', CloseCircleIcon, 'decidedAt'),
            ]),
        ),
      S.listItem()
        .title('Search gaps')
        .id('searchGapsOpen')
        .icon(typeIcon(S, 'searchGap'))
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
        .icon(UlistIcon)
        .child(
          S.documentList()
            .title('All gaps')
            .apiVersion(API_VERSION)
            .filter('_type == "searchGap"')
            .defaultOrdering([{ field: 'lastSeen', direction: 'desc' }]),
        ),
    ])

/** The icon a document type declares, for a list item that is not a plain type list. */
function typeIcon(S: StructureBuilder, type: string) {
  return S.context.schema.get(type)?.icon as ComponentType | undefined
}

/** A page that exists once opens its document directly, with no list in between. */
function singleton(S: StructureBuilder, type: SingletonType, title: string) {
  return S.listItem()
    .title(title)
    .id(type)
    .icon(typeIcon(S, type))
    .child(S.document().schemaType(type).documentId(SINGLETON_IDS[type]))
}

/** One list per status, so an idea moves from one to the next as an editor decides. */
function ideas(
  S: StructureBuilder,
  status: IdeaStatus,
  title: string,
  icon: ComponentType,
  orderBy: 'estimatedDemand' | 'decidedAt',
) {
  return S.listItem()
    .title(title)
    .id(`productIdeas-${status}`)
    .icon(icon)
    .child(
      S.documentList()
        .title(title)
        .apiVersion(API_VERSION)
        .filter('_type == "productIdea" && status == $status')
        .params({ status })
        .defaultOrdering([{ field: orderBy, direction: 'desc' }]),
    )
}
