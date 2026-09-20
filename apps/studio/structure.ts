// Version 5 of the icon package exports each icon from its own path.
import { BulbOutlineIcon } from '@sanity/icons/BulbOutline'
import { CheckmarkCircleIcon } from '@sanity/icons/CheckmarkCircle'
import { ClockIcon } from '@sanity/icons/Clock'
import { CloseCircleIcon } from '@sanity/icons/CloseCircle'
import { CogIcon } from '@sanity/icons/Cog'
import { CommentIcon } from '@sanity/icons/Comment'
import { CreditCardIcon } from '@sanity/icons/CreditCard'
import { HelpCircleIcon } from '@sanity/icons/HelpCircle'
import { HomeIcon } from '@sanity/icons/Home'
import { PackageIcon } from '@sanity/icons/Package'
import { SearchIcon } from '@sanity/icons/Search'
import { TagIcon } from '@sanity/icons/Tag'
import { UlistIcon } from '@sanity/icons/Ulist'
import type { ComponentType } from 'react'
import type { StructureBuilder, StructureResolver } from 'sanity/structure'
import { ANALYSE_THRESHOLD, type IdeaStatus } from '@repo/demand/constants'
import { SINGLETON_IDS, type SingletonType } from '@repo/sanity'

const API_VERSION = '2026-09-01'

/**
 * The desk, in the order an editor works: what they write every day, then the
 * three pages that exist once, then the categories that mirror the API and
 * nobody edits, then the search-gap loop's proposals and the gaps behind them.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.documentTypeListItem('product').title('Products').icon(PackageIcon),
      S.documentTypeListItem('faq').title('FAQs').icon(HelpCircleIcon),
      S.documentTypeListItem('testimonial').title('Testimonials').icon(CommentIcon),

      S.divider().title('Website'),
      singleton(S, 'homePage', 'Home page', HomeIcon),
      singleton(S, 'checkoutPage', 'Checkout page', CreditCardIcon),
      singleton(S, 'siteSettings', 'Site settings', CogIcon),

      S.divider().title('Taxonomies'),
      S.documentTypeListItem('category').title('Categories').icon(TagIcon),

      S.divider().title('Demand signals'),
      S.listItem()
        .title('Product ideas')
        .id('productIdeas')
        .icon(BulbOutlineIcon)
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
        .icon(SearchIcon)
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

/** A page that exists once opens its document directly, with no list in between. */
function singleton(S: StructureBuilder, type: SingletonType, title: string, icon: ComponentType) {
  return S.listItem()
    .title(title)
    .id(type)
    .icon(icon)
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
