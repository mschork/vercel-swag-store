# Vercel Swag Store

A storefront over the Vercel Swag Store API, with editorial content from Sanity layered on top. The API owns commerce facts; Sanity owns marketing and enrichment.

## Language

**Category**:
The API's flat taxonomy of products. Owned by the API, never edited in Sanity.
_Avoid_: Collection, tag, group

**Collection**:
An editorial grouping of products curated in Sanity, referencing products by API id. May span categories and never mirrors one.
_Avoid_: Category, set

**Search gap**:
A recorded search query that returned no products, with how often it was seen.
_Avoid_: Missed search, idea, gap request

**Product idea**:
A suggested product generated from one or more search gaps, awaiting a human accept or reject.
_Avoid_: Gap, suggestion, recommendation
