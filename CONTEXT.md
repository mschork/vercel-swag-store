# Vercel Swag Store

A storefront over the Vercel Swag Store API, with editorial content from Sanity layered on top. The API owns commerce facts; Sanity owns marketing and enrichment.

## Language

**Catalogue data**:
Products, categories and store configuration as the API reports them. Cached and revalidated by tag; shared by every visitor.
_Avoid_: Static data, master data

**Live data**:
Stock, promotion and cart. Fetched on every request and never cached, because the API changes them per request or per visitor.
_Avoid_: Dynamic data, realtime data

**Cart token**:
The credential that identifies one anonymous cart. Lives only in an httpOnly cookie and on the server; the browser never reads it.
_Avoid_: Cart id, session, session token

**Category**:
The API's flat taxonomy of products. Owned by the API, never edited in Sanity.
_Avoid_: Collection, tag, group

**Featured product**:
A product the API flags as featured; a human choice, not a popularity measure.
_Avoid_: Popular, trending, bestseller

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
