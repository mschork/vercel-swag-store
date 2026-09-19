---
status: accepted
date: 2026-09-19
---

# The search-gap loop runs on three runtimes, and its documents have dotted ids

The loop (specs/E13-search-gap-loop.md) has four jobs with different needs, so each runs where that need is met natively instead of all of them running in one place.

- **Capture** runs in the store, in `after()`. It must never delay a page, and only the store sees the search.
- **The trigger** is a Sanity Function on the gap document. The event is a Sanity event: a count changed. A Function reacts to exactly that with a GROQ filter and no polling, and Vercel's Hobby cron is daily, which is too slow to feel like a loop. The Function writes nothing, so it cannot re-trigger itself.
- **The analysis** is a Vercel Workflow in the store. It waits ten minutes, calls a model that can fail or time out, and must never leave gaps stuck in `analysing`. Durable steps with retries, a durable sleep and a hook token used as a lock give that without a queue or a lock table of our own. It also reads the catalogue through the store's own cached API functions, so "already sold" is judged against the source of truth (AGENTS.md rule 1) at no extra API cost. A Sanity Function could not do this: its timeout is measured in seconds, and it has no access to those cached readers.
- **The review** stays in Sanity, because the people who decide work in the Studio and the idea is a Sanity document. Accept and Reject are Studio document actions that set the idea's status; a second Sanity Function, `idea-decided`, reacts to that change, stamps the date and promotes the idea's gaps. Sanity Workflows was evaluated for this step and left out: it needs a runtime of three more Functions, and the documentation of the release evaluated (0.33.0) calls that runtime experimental and not ready for production use. Document actions and Functions are stable, and give an editor the same two buttons.

The cost is two platforms to watch and a shared secret between them. `@repo/demand` keeps that honest: every filter, id, prompt, schema and query lives there once, and each runtime is a thin caller.

## Dotted ids

The dataset is public, and a search box receives whatever people type. `searchGap` and `productIdea` documents therefore carry ids with a dot (`searchGap.<hash>`). Sanity treats an id containing a dot as private: a token or a logged-in editor can read it, an anonymous client cannot. E08 avoids dotted ids for the catalogue mirrors for the same reason this uses them. The store's anonymous client can never read these documents, so no page can leak them, and no dataset ACL or second dataset is needed. Verified: an anonymous query for both types returns nothing, the Studio opens and edits them, and a document Function fires on them with default settings.

## Considered options

- Everything in the store, triggered by Vercel Cron: one platform, but a daily cadence on Hobby, and polling Sanity for something Sanity can announce.
- Sanity Workflows for the review: a modelled process with a task list, but an early-access engine whose runtime its own README marks as not production ready, exact-pinned packages, and a dependency override in the Studio. Revisit when it is generally available.
- Everything in Sanity Functions: no shared secret, but no durable wait, a short timeout around a model call, and a second copy of catalogue reading outside the store's cache.
- A private dataset for demand documents: real isolation, but a second dataset to provision, and references from ideas to categories cannot cross datasets.

## Consequences

- `POST /api/demand/analyse` is the only door between the platforms. It is bearer-protected, starts a run and answers at once; extra calls are free because the lock turns them away.
- The Function's secrets are set with `sanity functions env add`, never in `sanity.blueprint.ts`, which is in git.
- The model is one constant in `@repo/demand`. The schema uses nullable rather than optional fields so it holds for every provider's structured output.
- If Vercel Workflow had not built with Cache Components, the route would have awaited the same functions in order; the spike showed it builds and leaves every route's rendering mode unchanged.
