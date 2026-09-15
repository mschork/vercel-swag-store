# Vercel Swag Store

A storefront over the Vercel Swag Store API, with editorial content from Sanity layered on top. The API owns commerce facts; Sanity owns marketing and enrichment.

## Language

**Catalogue data**:
Products, categories and store configuration as the API reports them. Cached and revalidated by tag; shared by every visitor.
_Avoid_: Static data, master data

**Live data**:
Stock, promotion and cart. Fetched on every request and never cached, because the API changes them per request or per visitor.
_Avoid_: Dynamic data, realtime data

**Shell**:
The part of a route that is prerendered at build and identical for every visitor: header, footer, page frame and cached catalogue content.
_Avoid_: Static page, layout

**Dynamic hole**:
A Suspense boundary inside the shell whose content is rendered per request from live data.
_Avoid_: Dynamic section, island, client part

**Theme**:
Light or dark, taken from the visitor's operating-system preference. The store offers no control of its own and never learns the choice.
_Avoid_: Mode, dark mode, colour scheme, theme selector

**Cart**:
The anonymous set of lines the API holds for one cart token. One per browser, and none until the first add.
_Avoid_: Basket, bag, session cart

**Line**:
One product and its quantity in a cart. The API addresses it by product id, so a product appears at most once and repeated adds merge into it.
_Avoid_: Item, entry, row, line item

**Expired cart**:
A cart the API has forgotten after 24 hours without a change. The store treats a 404 for the cart itself as expiry and starts a new cart on the next add.
_Avoid_: Lost cart, session timeout, stale cart

**Cart token**:
The credential that identifies one anonymous cart. Lives only in an httpOnly cookie and on the server; the browser never reads it.
_Avoid_: Cart id, session, session token

**Checkout page**:
The static page shown after the demo order. Placing the order means the store forgets the cart; nothing is charged, shipped or sent anywhere.
_Avoid_: Order confirmation, thank-you page, checkout (as a process)

**Category**:
The API's flat taxonomy of products. Owned by the API, never edited in Sanity.
_Avoid_: Collection, tag, group

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
