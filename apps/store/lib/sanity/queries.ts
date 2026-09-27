import { defineQuery } from 'next-sanity'

/**
 * Every GROQ query the store runs, in one file so `sanity typegen` can find
 * them and give each one a result type. Images ask for `metadata.lqip`, which
 * `lib/sanity/image.ts` turns into the `next/image` placeholder.
 */

const IMAGE = `{ ..., "lqip": asset->metadata.lqip, "aspectRatio": asset->metadata.dimensions.aspectRatio }`

export const siteSettingsQuery = defineQuery(`
  *[_type == "siteSettings"][0]{
    storeName, seoTitle, seoDescription, footerText,
    productPage{ aboutHeading, careHeading, testimonialsHeading, faqHeading },
    productListing{ intro },
    cartPage{ favouritesHeading },
    searchPage{ featuredHeading },
    testimonialsPage{ heading, intro, submitLabel },
    "ogImage": ogImage${IMAGE},
    socialLinks[]{ label, url }
  }
`)

export const homePageQuery = defineQuery(`
  *[_type == "homePage"][0]{
    hero{ headline, description, "image": image${IMAGE} },
    featured{ heading, linkLabel },
    favourites{ heading }
  }
`)

export const checkoutPageQuery = defineQuery(`
  *[_type == "checkoutPage"][0]{ title, body, continueShoppingLabel }
`)

/**
 * One product's enrichment, plus the two lists the page needs beside it: the
 * questions its category answers and the questions it attaches itself. They
 * come back separately and are merged in TypeScript, where the rule is
 * testable (`lib/sanity/faqs.ts`).
 */
export const productQuery = defineQuery(`
  *[_type == "product" && apiId == $apiId][0]{
    extendedDescription, care,
    "gallery": gallery[]${IMAGE},
    "categoryFaqs": *[_type == "faq" && references(^.category._ref)]{ _id, question, answer, order },
    "attachedFaqs": faqs[]->{ _id, question, answer, order }
  }
`)

/** A category's intro for its product listing, by the API slug the document mirrors. */
export const categoryQuery = defineQuery(`
  *[_type == "category" && apiSlug == $apiSlug][0]{ _id, intro }
`)

/** Testimonials naming this product, newest first. */
export const testimonialsForProductQuery = defineQuery(`
  *[_type == "testimonial" && consent == true && references($productDocId)]
    | order(publishedAt desc){
      _id, person, role, quote,
      "photo": photo${IMAGE}
    }
`)

/**
 * The wall at `/testimonials`: the first `$end` testimonials with consent,
 * newest first, each with the API ids of the products it names. The id
 * breaks a tie so the pages never overlap or skip an entry.
 */
export const testimonialWallQuery = defineQuery(`
  *[_type == "testimonial" && consent == true]
    | order(publishedAt desc, _id asc)[0...$end]{
      _id, person, role, quote,
      "photo": photo${IMAGE},
      "productIds": products[]->apiId
    }
`)

/** How many testimonials the wall holds, which sets how many pages it has. */
export const testimonialCountQuery = defineQuery(`
  count(*[_type == "testimonial" && consent == true])
`)

/**
 * The products named most by testimonials with consent on record, the same
 * filter as `testimonialsForProductQuery`: the count first, then the
 * newest entry, then the id so the order never shuffles between two builds.
 * Mirrors the API no longer returns are skipped, and the store looks every
 * `apiId` up in the API before rendering anything. Unsliced, so every caller
 * shares one cache entry and takes as many rows as it needs.
 */
export const favouriteProductsQuery = defineQuery(`
  *[_type == "product" && missing != true && count(*[_type == "testimonial" && consent == true && references(^._id)]) > 0]{
    apiId,
    "mentions": count(*[_type == "testimonial" && consent == true && references(^._id)]),
    "newest": *[_type == "testimonial" && consent == true && references(^._id)] | order(publishedAt desc)[0].publishedAt
  } | order(mentions desc, newest desc, apiId asc)
`)
