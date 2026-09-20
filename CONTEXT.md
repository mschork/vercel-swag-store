# Vercel Swag Store

A storefront over the Vercel Swag Store API, with editorial content from Sanity layered on top. The API owns commerce facts; Sanity owns marketing and enrichment.

## Language

**Catalogue data**:
Products, categories and store configuration as the API reports them. Cached and revalidated by tag; shared by every visitor.
_Avoid_: Static data, master data

**Live data**:
Stock, promotion and cart. Never cached, because the API changes them per request or per visitor. The cart is read per request; stock and the promotion are read once per visit and held in the visit.
_Avoid_: Dynamic data, realtime data

**Visit**:
What the store remembers about one visitor for 24 hours, held in the `visit` cookie: their stock draws and their pinned promotion. It exists because the API redraws both on every request, so without it no number could be shown twice (`docs/adr/0006-the-stable-visit.md`).
_Avoid_: Session, user state, inventory cookie

**Stock draw**:
One answer from the stock endpoint for one product. The store asks once per product per visit and keeps it.
_Avoid_: Stock level, stock count, inventory number

**Inventory**:
The visit's stock draws, keyed by product id.
_Avoid_: Stock map, warehouse

**Remaining**:
A product's draw minus the quantity of it in the visitor's cart. This is the number every surface shows and enforces, so emptying the cart puts the stock back.
_Avoid_: Available, free stock, left

**Pinned promotion**:
The one promotion a visit holds, chosen the first time the store asks the promotions endpoint in that visit. The API rotates four of them per request; the banner shows this one all visit.
_Avoid_: Current promotion, active offer

**Shell**:
The part of a route that is prerendered at build and identical for every visitor: header, footer, page frame and cached catalogue content.
_Avoid_: Static page, layout

**Dynamic hole**:
A Suspense boundary inside the shell whose content is rendered per request from live data.
_Avoid_: Dynamic section, island, client part

**Theme**:
Light or dark, taken from the visitor's operating-system preference. The store offers no control of its own and never learns the choice.
_Avoid_: Mode, dark mode, colour scheme, theme selector

**Product document**:
The Sanity document for one product: its API fields mirrored read-only, plus the editorial fields an editor writes. Distinct from a Product, which is what the API returns and what the store renders (`docs/adr/0003-sanity-mirrors-api-products-and-categories.md`).
_Avoid_: Sanity product, enrichment document, product entry

**Enrichment**:
The editorial fields on a product document: the longer description, the care text, extra photos of the product and the questions it attaches. Never commerce facts; the API wins for anything it owns.
_Avoid_: Product content, extra content, overrides

**Category document**:
The Sanity mirror of one API category, plus the intro an editor writes for its product listing. The mirror lets an FAQ point at a category and a product be matched to it.
_Avoid_: Sanity category, taxonomy term

**Category intro**:
The one short sentence or two an editor writes about a category, shown under the heading of that category's product listing. Optional; the listing is complete without it.
_Avoid_: Category description, category enrichment, blurb

**Testimonial**:
What one person says about the products they are photographed with: a quote, their name and role, and the photo. Shown on the page of each product it names, under "What people say about it".
_Avoid_: Lookbook entry (the term until 19 Sep 2026), editorial photo, story, review (nobody rates anything)

**Testimonial mention**:
One published testimonial naming one product. It records that an editor photographed the product with someone, not that anyone bought, rated or clicked it. The count of mentions is what orders the favourites on the home page.
_Avoid_: Popularity, rating, vote, like

**FAQ**:
One question and its answer, written once and shown on many products. It reaches a product through the categories it names, or because that product attaches it directly.
_Avoid_: Help article, question entry

**Cart**:
The anonymous set of lines the API holds for one cart token. One per browser, and none until the first add.
_Avoid_: Basket, bag, session cart

**Line**:
One product and its quantity in a cart. The API addresses it by product id, so a product appears at most once and repeated adds merge into it.
_Avoid_: Item, entry, row, line item

**Expired cart**:
A cart the API has forgotten after 24 hours without a change. The store treats a 404 for the cart itself as expiry and starts a new cart on the next add.
_Avoid_: Lost cart, session timeout, stale cart

**Confirmed count**:
The number of items in the cart as the API last reported it. The header badge may run ahead of it while a change is saving, and falls back to it when the change fails or gets no answer.
_Avoid_: Cart count, badge number, server count

**Cart token**:
The credential that identifies one anonymous cart. Lives only in an httpOnly cookie and on the server; the browser never reads it.
_Avoid_: Cart id, session, session token

**Checkout page**:
The static page shown after the demo order. Placing the order means the store forgets the cart; nothing is charged, shipped or sent anywhere.
_Avoid_: Order confirmation, thank-you page, checkout (as a process)

**Category**:
The API's flat taxonomy of products. Owned by the API, never edited in Sanity.
_Avoid_: Collection, tag, group

**Product listing**:
The page that shows every product the API returns, optionally narrowed to one category. For browsing; search is for finding.
_Avoid_: Overview, shop, catalogue page, all products

**Featured product**:
A product the API flags as featured; a human choice, not a popularity measure.
_Avoid_: Popular, trending, bestseller

**Hero product**:
The featured product whose photo, name and page the home hero uses when no editorial hero image exists. Chosen by slug, resolved from the API.
_Avoid_: Hero image, featured item

**Promotion**:
The one offer the API returns for a request. It changes between requests and is shown as returned, never filtered by date or amount.
_Avoid_: Sale, banner, deal

**Top-up**:
Catalogue products appended after the featured products so a grid reaches its minimum size. Never labelled as featured.
_Avoid_: Filler, fallback products

**Catalog product**:
A read-only copy in Sanity of one API product, kept so editors can pick and reference products without the Studio calling the API.
_Avoid_: Product (when the API record is meant), enrichment

**Collection**:
An editorial grouping of products curated in Sanity, referencing products by API id. May span categories and never mirrors one.
_Avoid_: Category, set

**Search gap**:
A recorded search query that returned no products, with how often it was seen.
_Avoid_: Missed search, idea, gap request

**Product idea**:
A suggested product generated from one or more search gaps, awaiting a human accept or reject.
_Avoid_: Gap, suggestion, recommendation
