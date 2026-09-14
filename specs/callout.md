# Callouts

Things worth saying out loud in the presentation or README because they are deliberate choices that could look like omissions.

- **One cache, not two** (E09 Q17). `useCdn: false` on the Sanity client. Sanity's CDN is a second cache with its own staleness; relying on Next's `"use cache"` plus tag revalidation from the publish webhook keeps a single, explainable freshness story.
- **Search gaps are analysed only after two searches** (E13 Q24). A single zero-result query is noise (typos, one-off curiosity). The threshold is a constant so it can be tuned.
- **The build fails if the API is unreachable** (E02 Q3). Product pages prerender at build time; a build that cannot reach the API stops rather than shipping an empty store. The failure is visible in the Vercel build log.
- **Search keeps the previous results while the next ones load** (E07 Q7). The results grid sits in a Suspense boundary that is not re-keyed per search. React keeps the old grid on screen and swaps in the new one when the cached `getProducts` call resolves; the form shows a pending cue via `useFormStatus`. Re-keying the boundary would flash a skeleton on every debounced keystroke, which reads as slower than a 50 ms API.
- **CI is two jobs** (E12 Q11). A fast `verify` job (lint, typecheck, build, Vitest) is required to merge. A Playwright job (smoke plus visual regression) runs on the same PR but is not required, so a flaky screenshot never blocks a merge; failures are still visible on the PR.
- **Search-gap dedupe lives in Sanity, not in memory** (E13 Q13). Each zero-result query maps to one `searchGap` document keyed by its normalised text. Before bumping `count`, the recorder reads `lastSeen` and skips if it is under ten minutes old. That is exact across serverless instances; an in-memory LRU would not be.
