# Callouts

Things worth saying out loud in the presentation or README because they are deliberate choices that could look like omissions.

- **One cache, not two** (E09 Q17). `useCdn: false` on the Sanity client. Sanity's CDN is a second cache with its own staleness; relying on Next's `"use cache"` plus tag revalidation from the publish webhook keeps a single, explainable freshness story.
- **Search gaps are analysed only after two searches** (E13 Q24). A single zero-result query is noise (typos, one-off curiosity). The threshold is a constant so it can be tuned.
- **The build fails if the API is unreachable** (E02 Q3). Product pages prerender at build time; a build that cannot reach the API stops rather than shipping an empty store. The failure is visible in the Vercel build log.
