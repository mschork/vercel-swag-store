# Improvements

Ideas deliberately left out of the release. Each entry names the decision it comes from so the trade-off is traceable. Nothing here is scheduled.

- **Inline header search** (E03 Q4). The nav has a link to `/search` because the requirements ask for a search page. A header search box, as on vercel.store, would shorten the path to results but means a second form and a second debounce; revisit once the search page is stable.
- **Copy-to-clipboard on the promo code** (E04 Q8). The promo banner is static text inside a Suspense hole so it stays a server component. A copy button needs a small client leaf.
- **Category browsing route** (E05 Q10). The breadcrumb category links to `/search?category=<slug>`, reusing the search page. A dedicated `/category/<slug>` route could be fully static (no `searchParams`) and offer richer category content from Sanity.
- **Cookie banner**. The cart token lives in an httpOnly cookie. It is strictly necessary for the cart to work, so consent is not legally required in most jurisdictions, but a short notice would make the behaviour transparent. Decide with the README's privacy note in E12.
- **Art-directed hero image** (E04 Q1). E09 makes the hero image authorable in Sanity (`homePage.hero.image`, falling back to a product photo). What remains: art direction per breakpoint via Sanity hotspot and crop, a low-quality placeholder from Sanity image metadata, and a measured LCP comparison between the Sanity pipeline and the blob-store photo.
- **Toast notifications** (E05 Q6). Add-to-cart confirms inline on the product page. A toast (`sonner`) would confirm from anywhere, for example a future quick-add on product cards.
- **Icons for footer social links** (E03 Q3). The footer renders the API's `socialLinks` as text links labelled from the record key. Icons would need one inline SVG per known network plus a text fallback for unknown keys; add them once the set of networks the API returns is stable.
