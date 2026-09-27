# E25 The testimonial agent

Branch: `epic/E25-testimonial-agent`. Depends on: E08, E09, E13, E24. Blocks: nothing. One PR per slice; each slice leaves `main` shippable, and the epic can stop after any of them.

## Goal

A visitor tells the store what they think of something they bought, with a photo of it, by talking to an agent instead of filling in a form. The agent looks at the photo, says whether it is usable, works out which product is in it and asks the visitor to confirm, helps them put their words into 240 characters, and checks their email address with a code. An editor then accepts or rejects the submission in the Studio. An accepted submission becomes an ordinary `testimonial`: it appears on the product's page, on the wall at `/testimonials`, and counts toward "People's favourites" on the home page. The visitor gets an email either way.

It is not a product finder and not a general chat. The agent has one job and declines everything else.

Decisions that are not in this spec are in `docs/adr/0008-testimonial-submissions.md`.

## Terms

`CONTEXT.md` defines them: testimonial, testimonial mention, submission, draft. A submission is never called a review (nobody rates anything) or a testimonial until an editor accepts it.

## Why it fits

| Piece | Job | Where |
|---|---|---|
| AI SDK 7, `useChat` from `@ai-sdk/react` | the chat UI, client-side tools that render the widgets | `components/testimonials/` |
| `WorkflowAgent` from `@ai-sdk/workflow` | the agent loop as durable steps; a dropped connection resumes the stream | `apps/store/workflows/testimonial.ts` |
| Vercel Workflow (`workflow` 5 beta, exact pins) | one run per submission: conversation, submit, wait for the editor, notify, clean up | `apps/store/workflows/testimonial.ts` |
| AI Gateway | a vision model on the free tier (`google/gemini-2.5-flash`), one constant | `MODEL` in `@repo/testimonials` |
| Vercel Blob, private store, over OIDC | the photo from upload until the editor decides | `app/api/testimonials/upload/route.ts` |
| Vercel BotID (Basic) | refuses bots on every testimonial route | `instrumentation-client.ts`, the routes |
| Vercel Firewall rate limit | one rule, keyed on the IP address | `checkRateLimit` in the routes |
| Resend (its own Vercel integration), over `fetch` | the verification code and the outcome emails | `lib/email/send.ts` |
| Sanity: `testimonialSubmission` schema, Studio actions, photo preview input | the editor's decision | `packages/sanity`, `apps/studio` |
| Sanity Function `submission-decided` | wakes the waiting run when the editor decides | `apps/functions/submission-decided` |
| Sanity assets | the photo, once accepted | written by the workflow |
| Sanity Workflows (early access) | not here, for the reason in `docs/adr/0004-demand-loop-runtimes.md` | |

No new dependency beyond `@ai-sdk/workflow`, `@ai-sdk/react`, `@vercel/blob`, `botid` and `@vercel/firewall`. No email SDK, no image library, no UI kit.

## The flow

```
footer "Submit a testimonial" ──▶ /testimonials#share  (chat opens)
/testimonials ──▶ CTA "Submit a testimonial" ──▶ chat loads on demand, URL gains #share

first photo or message ──▶ POST /api/testimonials/chat ──▶ start(testimonial)  run bound to the session id
   loop: agent.stream() until it ends or asks for a widget ─▶ await the turn hook (or 30 min idle)
         next message or widget answer ──▶ POST /api/testimonials/chat/<runId>/message ──▶ resumeHook
     photo widget ─▶ browser downsizes, re-encodes (EXIF gone) ─▶ private Blob
     analysePhoto ─▶ quality, safety, ranked products ─▶ confirm widget (Yes / pick another)
     name, quote (≤ 240, visitor approves the exact text), consent ─▶ checkText
     email ─▶ sendCode ─▶ code widget ─▶ verifyCode
     submit ─▶ testimonialSubmission.<id> written (private) ─▶ "Thanks, an editor will look at it"
   idle 30 min before submit ─▶ blobs deleted, run ends

   await hook testimonial-review:<id>        (no time limit, sleep costs nothing)
        ▲
   Studio: Accept | Reject (reason) ─▶ status patched ─▶ Function submission-decided
        ─▶ POST /api/testimonials/decision (bearer) ─▶ resumeHook

   accepted: photo to Sanity assets ─▶ testimonial-<id> published (consent: true)
             ─▶ Sanity webhook revalidates sanity:testimonial ─▶ approval email
   rejected: rejection email with the reason
   both:     blob deleted, email removed from the submission
```

## Experience

### The page

- `app/testimonials/page.tsx`, prerendered. A heading, one line of intro, a "Submit a testimonial" button, and the wall below.
- The wall is every published testimonial with consent, newest first, `"use cache"` and tagged `sanity:testimonial` through `sanityFetch`. Page 1 renders in the shell. Further pages are prerendered at `/testimonials/page/[n]` with `generateStaticParams` from the count, and a `beforeFiles` rewrite sends `/testimonials?page=:n` there, the way `/search?category=` is rewritten in `next.config.ts`. No `searchParams` read, so no dynamic hole. `WALL_PAGE_SIZE` is a named constant.
- The chat is a client island loaded with `next/dynamic` only when it opens. The button opens it and sets `#share`; a small client component opens it on load when the URL already has `#share`. The server render is the same either way. The chat opens ready to use, with no second click: a greeting written into the component, not generated, and the photo widget already shown. Opening it starts no run. The visitor's first action, choosing a photo or sending a message, starts the run, and from then on the agent leads.
- The footer gains one link, "Submit a testimonial", to `/testimonials#share`. Every "Submit a testimonial" link elsewhere in the store points there too, so the chat is open on arrival; only the button on `/testimonials` itself opens it in place. The copy lives in `siteSettings` with a shipped fallback, like the footer text.
- Metadata, the sitemap and the Markdown route (`/md/testimonials`) include the page. `robots` follows E20.

### Layout

- Desktop: the chat on the left; the draft card on the right, sticky, filling in as each fact is confirmed, with a checklist of the six facts a submission needs: photo, product, name, quote, consent and a verified email (`DRAFT_FACTS`).
- Mobile: the draft card is a one-line bar above the chat ("Your testimonial · 3 of 6") that expands on tap.
- The draft card is rendered from transient `data-draft` parts. The run writes one to its main stream, as a step, after every tool that changes the draft; the model never writes it. `toUIMessageChunk` drops parts it does not know, so the chat, message and stream routes map `data-draft` parts into the UI stream themselves, and `useChat`'s `onData` keeps the latest. One stream keeps the chunk indices the transport resumes from the same on every read. The photo in the card is a local `blob:` URL, which the CSP already allows.

### The conversation

The agent leads. Every fact arrives through a widget, a client-side tool with no `execute`. The visitor can always type instead; the agent then answers with the widget again.

How a turn works under `WorkflowAgent`:

- `agent.stream({ messages, writable, preventClose: true, sendFinish: false })` runs until the model answers or calls a client-side tool. A tool with no `execute` ends the call with the tool call unresolved (in `toolCalls`, not in `toolResults`); nothing waits inside the agent.
- The run keeps `result.messages` without the system message, which the next call refuses, and reads server tool results from `result.steps`, since `result.toolResults` holds only the last step's.
- After each turn the run writes a `turn-end` part to its stream, then waits on its turn hook, created once with `defineHook` and the run id as token, read through its async iterator and raced against `sleep(IDLE_TIMEOUT)`.
- The browser answers a widget with `addToolOutput` and sends a message with `sendMessage`. Both reach `POST /api/testimonials/chat/<runId>/message`, which resumes the hook. The run appends the payload as a `tool` result or a user message and calls `agent.stream()` again. A message typed while a widget is open first answers every unresolved call with `{ visitorTypedInstead: true }`, because the model needs a result for each call.
- Before resuming the hook, the route saves the stream's next index as the turn's start in the session store. The chat, message and stream routes read the run's stream from that index and stop at `turn-end`; `createModelCallToUIChunkTransform` then writes `finish`, so `useChat` returns to ready between turns. `useChat`'s `id` is the run id, so `WorkflowChatTransport` reconnects after a reload through `/api/testimonials/chat/<runId>/stream`, which replays the current turn.
- The `UIMessage[]` is kept in the session store under the run id, because messages delivered through the hook are not in the run's stream and a reload needs them. Only the last assistant message renders widgets; earlier ones show what was answered.
- The message route answers 410 when the run has ended (`HookNotFoundError`). A failed run does not close its stream, so every route that streams ends its response when the run fails.
- A turn costs about 13 run events, and 3 more per server tool; `MAX_TURNS` stays far below the 25,000 events a run may hold.

| Tool | Kind | What happens |
|---|---|---|
| `askPhoto` | client | an upload button; the browser downsizes to `MAX_PHOTO_EDGE` px and re-encodes as JPEG through a canvas, which drops EXIF including location, then uploads to private Blob with `uploadPresigned` and answers the pathname. The upload is aborted after `UPLOAD_TIMEOUT_SECONDS`, because a refused request is retried silently |
| `analysePhoto` | server | reads the blob with `get(pathname, { access: 'private' })`; one vision call with structured output: quality (score, issues), safety (ok, reason), `markVisible` (the store's mark, see below), up to three candidate products (id, confidence), a suggested alt text. Runs against the catalogue from `getAllProducts` |
| `confirmProduct` | client | the top candidate's card with its API image: Yes, or "Pick another" showing the next two and a catalogue picker. The next two matter: the vision model confuses near-identical products (the notebooks, the book; the tumbler and the travel mug), and the right one is then almost always second |
| `askName` | client | a text input; the name is published exactly as typed |
| `reviewQuote` | client | an editable text area holding the visitor's words, or the agent's shorter suggestion when they run over 240 characters; the visitor approves the exact text |
| `checkText` | server | one small structured call: is the name, the quote or the suggested alt text abusive, obscene or a slur. A hit sends the agent back to `askName` or `reviewQuote`, or drops the alt text |
| `askConsent` | client | a checkbox: "I took this photo and allow the store to publish it with my name and words" |
| `askEmail` | client | an email input, zod-validated. The browser answers the tool with `{ provided: true }` and sends the address to the message route in a separate field, which a step saves in the draft. `toModelOutput` does not apply to a result the run appends, so keeping the address out of the tool output is the only guard |
| `sendCode` | server | a 6-digit code, emailed; only its hash is kept in the run |
| `askCode` | client | six inputs; "send again" after `CODE_RESEND_SECONDS` |
| `verifyCode` | server | compares hashes; `CODE_MAX_ATTEMPTS` tries, `CODE_TTL_MINUTES`. The model sees `email: verified`, never the address |
| `submit` | server | enabled only when the draft is complete and the email is verified; writes the submission |

Rules the agent follows, enforced by code, not by the prompt:

- **The draft lives in the run.** Only tool results change it. `submit` reads the draft, never the model's arguments, so the model cannot invent a product, a verified email or consent.
- **Photo.** A run accepts at most `MAX_PHOTO_ATTEMPTS` uploads, whatever the reason for the retry: unsafe, unusable, no mark or no confident match. Each retry states the reason. When the attempts are used up, the agent offers the picker, or ends the conversation if the last photo was unsafe. Each superseded blob is deleted when the next upload arrives.
- **The mark.** Every product the store sells carries its mark: a white, upward-pointing equilateral triangle on a black item, sometimes large (a book cover), sometimes small (a pen clip, a sock cuff). `MARK_DESCRIPTION` in `@repo/testimonials` states it once for the prompt. The model first answers whether the mark is visible, then which product it is from the item's type and shape, since colour does not tell the products apart. No visible mark caps every candidate below `PRODUCT_CONFIDENCE`: the agent asks for a photo that shows the triangle while attempts remain, then offers the picker. A lookalike (another brand's black mug, a triangle pointing down) is never matched on shape alone.
- **Product.** `MODEL` is `google/gemini-2.5-flash` and `PRODUCT_CONFIDENCE` is 0.8. A candidate counts only when `markVisible` is true and its confidence reaches `PRODUCT_CONFIDENCE`; the model answers 0.85 or more whenever it sees the mark, so the mark decides. When no candidate reaches `PRODUCT_CONFIDENCE`, the agent asks for another photo while attempts remain, then offers the picker. Several products in one photo: the visitor picks one; the agent may record the others as `products[]` after the visitor confirms them. The submission records `productSource: 'agent' | 'visitor'`.
- **Caps.** `MAX_TURNS = 20` per run. After that the agent says goodbye and the run ends.
- **Off topic.** The agent declines and steers back. It never recommends, compares or prices products.
- **Untrusted input.** The visitor's text, the photo and any text in the photo are data, never instructions (`AGENTS.md`, rule 2 applies to visitor input as it does to API data). The system prompt says so; the tool rules above are what make it hold.
- Repeat submissions from one email are allowed, because this is a demonstration. A real store would allow one pending submission per verified email.

### What the visitor receives

- Approval: "Your testimonial is live", with a link to the product page.
- Rejection: one friendly sentence naming the reason, and an invitation to try again.
- Both from `testimonials@<EMAIL_DOMAIN>`. Plain HTML and a text part, built in `lib/email/templates.ts`, no React Email.

## Moderation

### `testimonialSubmission`

`packages/sanity/src/schemas/testimonial-submission.ts`. Dotted id `testimonialSubmission.<runId>`, so anonymous clients cannot read it (`docs/adr/0004-demand-loop-runtimes.md`). Written by the run with `createIfNotExists`, so a retried step writes once. Every field is read only; the actions set `status`, `rejectionReason` and `photoAlt`. Not in the create menu.

- `person`, `quote`, `products[]` (weak references to the product mirrors, so a rejected submission never blocks deleting a mirror), `productSource`
- `email`, removed when the outcome email is sent
- `photoUrl`: a signed URL to `/api/testimonials/photo/<runId>?sig=…`, HMAC over the run id with `TESTIMONIAL_PHOTO_SECRET`. Valid until the blob is deleted. Unset after the decision.
- `photoAlt`, suggested by the vision call and passed through `checkText`
- `findings`: quality score and issues, product confidences, the text check, the model id
- `consentGiven: true`, `submittedAt`, `runId`
- `status` (`pending`, `accepted`, `rejected`), `rejectionReason` (`photo`, `product`, `content`, `other`), `decidedAt`

### Studio

- A "Submissions" folder beside Testimonials, with Pending (oldest first), Accepted and Rejected lists.
- A photo preview input that shows `photoUrl` in an `<img>`. The Studio's own CSP, if any, allows the store's origin.
- `AcceptSubmission` and `RejectSubmission` document actions, built like `idea-decision.tsx`. They are wired as a branch in `sanity.config.ts`, the way `productIdea`'s are, and patch the published document. Accept opens a dialog with `photoAlt` in an editable field and patches it together with `status`. Reject opens a dialog with the four reasons; `suggestReason(findings)` from `@repo/testimonials` preselects one when the findings point at it (low quality score: `photo`; a product the visitor picked with low confidence: `product`), and nothing otherwise. Editors never type text that goes into an email.
- Delete, duplicate, publish, unpublish and discard are removed from submissions.

### Decision

- `defineDocumentFunction` `submission-decided` in `sanity.blueprint.ts`: `on: ['update']`, filter `_type == 'testimonialSubmission' && status in ['accepted', 'rejected'] && delta::changedAny(status)`, projection `{_id, runId, status, rejectionReason, photoAlt}`. It POSTs that to `/api/testimonials/decision` with `TESTIMONIAL_DECISION_SECRET` and writes nothing.
- The route checks the bearer with `authorised()` from `lib/bearer.ts`, parses the body with zod (the id's `testimonialSubmission.` prefix, the `status` and reason enums) and calls `resumeHook('testimonial-review:<runId>', decision)` from `workflow/api`. `HookNotFoundError` answers 404; the Function logs it. `proxy.ts` leaves the route out of its matcher, next to `api/demand`.
- The run then:
  - accepted: reads the blob as a stream with `get(pathname, { access: 'private' })`, passes it to `client.assets.upload('image', stream, { filename, contentType: 'image/jpeg' })`, and creates `testimonial-<runId>` with `createIfNotExists` with `person`, `photo` (with `photoAlt`), `quote`, `products`, `consent: true`, `publishedAt`, `submission` (a weak reference). The existing GROQ webhook revalidates `sanity:testimonial`, which covers the product page, the wall and the favourites. Its filter lives in Sanity Manage; slice 4 checks it admits a `testimonial` create.
  - rejected: nothing in Sanity beyond the next step.
  - both: sends the email, deletes the blob, unsets `email` and `photoUrl`, stamps `decidedAt`.
- An editor who later wants a testimonial gone unpublishes it like any other.

## Data and privacy

- The email address is never published, never logged and never sent to the model. It leaves the submission when the outcome email goes out. It stays in the run's event log until that log's retention ends.
- The photo is private until an editor accepts it. Sanity serves every asset of a public dataset to anyone with its URL, so nothing unmoderated is uploaded to Sanity.
- No EXIF reaches the store: the browser re-encodes before upload.
- The run's event log holds the conversation. Its retention is Vercel's (1 day on Hobby, 7 on Pro after the run completes).
- `SANITY_API_WRITE_TOKEN`, `RESEND_API_KEY` and the two secrets are server only. Blob needs no token: the store signs uploads and reads blobs over OIDC.

## Abuse

- BotID Basic: `initBotId` from `botid/client/core` protects the chat, message and upload routes (POST) and the stream route (GET); each calls `checkBotId()` from `botid/server` and answers 403 to a bot. `withWorkflow(withBotId(config))`, in that order, because `withWorkflow` returns a function `withBotId` does not accept. `checkBotId()` throws outside Vercel under `next start`, so the routes call it only when `VERCEL` is set. BotID loads its script and posts its challenge through same-origin rewrites, so the CSP needs nothing for it.
- One Firewall rate-limit rule with a `@vercel/firewall` condition named `testimonials`, called with `checkRateLimit('testimonials', { request })` in the chat, message and upload routes. It keys on the IP address: a session id is free to mint, so it cannot be the limit's key. `checkRateLimit` is marked experimental.
- The chat, message, stream and upload routes require the `sid` cookie and answer only for the run bound to that session. The photo route is authorised by its HMAC signature and the decision route by its bearer, because the Studio and the Function send no cookie.
- The upload route uses `handleUploadPresigned` and signs in `getSignedToken` with `issueSignedToken` over OIDC: same session, a live run (choosing a photo starts the run first when there is none), JPEG only, `MAX_UPLOAD_BYTES`, at most `MAX_PHOTO_ATTEMPTS` per run. The route chooses the pathname, `testimonials/<runId>/<attempt>.jpg`, and scopes the token to it and to `put`. It passes a placeholder `webhookPublicKey`, which the SDK demands but uses only for upload-completed callbacks, and this flow registers none.
- The CSP's `connect-src` gains `https://vercel.com/api/blob/`, the path the browser uploads to, not the whole origin.
- The run's caps above bound model spend per visitor.

## Configuration

The agent runs in Production only, where `SANITY_API_WRITE_TOKEN` is set: the Function posts to one `STORE_URL`, and previews write to the same dataset. Previews show the page without the CTA.

Store, server only: `BLOB_STORE_ID` (the private store's id; not a secret, but server only), `RESEND_API_KEY` (provisioned by Resend's Vercel integration), `EMAIL_DOMAIN` (the verified sending subdomain, `mail.<domain>`), `TESTIMONIAL_PHOTO_SECRET` and `TESTIMONIAL_DECISION_SECRET` (min 32 each). `SANITY_API_WRITE_TOKEN` already exists. All optional in `lib/env.ts`: without `BLOB_STORE_ID` or a write token the CTA is hidden; without `RESEND_API_KEY` the email adapter logs the code and the message instead of sending, so the flow runs end to end locally.

Sanity Function `submission-decided`: `STORE_URL`, `TESTIMONIAL_DECISION_SECRET`, set with `sanity functions env add`.

Manual setup, done once by a person:

1. Resend: install Resend's own Vercel integration (resend.com, Settings → Integrations → Vercel) on the store project; the Vercel Marketplace listing offers only Pro to an email that already has a free Resend team. Add the subdomain `mail.<domain>`, add the SPF and DKIM records it lists (DMARC optional), wait for verification.
2. Blob: create a private store and connect it to the store project for Development, Preview and Production.
3. Firewall: add the rate-limit rule `testimonials` (fixed window, `RATE_LIMIT_WINDOW`, `RATE_LIMIT_REQUESTS`).
4. Vercel: set the two secrets, `EMAIL_DOMAIN` and `BLOB_STORE_ID` for Production.
5. Sanity Manage: check the revalidation webhook's filter admits `testimonial`.
6. Sanity: deploy the blueprint, then `sanity functions env add submission-decided …`.

## Slices

### Slice 0: spikes

Done on a throwaway branch (PR 17): Workflow 5 with Cache Components and the E13 workflow, the turn mechanics in one run, client-side tools, the vision model, Blob uploads under the CSP, and BotID with Workflow. Their answers are written into this spec.

### Slice 1: package, schemas, Studio

- Upgrade, exact pins written by hand (pnpm keeps an existing caret): `workflow@5.0.0-beta.57`, `@workflow/vitest@5.0.0-beta.57`, `@ai-sdk/workflow@2.0.47`, `ai@7.0.116` (which `@ai-sdk/workflow` requires), `@ai-sdk/react@4.0.119`. `engines` requires Node 24, as `.nvmrc` does. The workflow integration tests register a resolve hook that maps `next/cache` to a stub and `next/<name>` to its `.js` file, because `@workflow/vitest` 5 hands its bundles to Node's own loader. Upgrades after that are deliberate and one at a time.
- `packages/testimonials` (`@repo/testimonials`): `constants.ts` (every number named in this spec, `MODEL`), `schemas.ts` (zod for tool inputs, the photo analysis, the text check, the decision body), `prompt.ts` (the system prompt), `draft.ts` (the draft type and `applyToolResult`, pure), `reason.ts` (`suggestReason`), `store.ts` (GROQ and writes over a client passed in). No Next imports.
- `testimonialSubmission` schema; `testimonial` gains `submission` (weak reference, read only, hidden when empty). Typegen re-run.
- Studio: the Submissions folder, the photo preview input, the two actions.
- The write token now serves two features: update the comment in `lib/sanity/write-client.ts`, `docs/operations.md` and the cache policy table in `AGENTS.md` (wall, chat, submissions).

### Slice 2: page and wall

- `/testimonials` with the wall, "Show more", metadata, sitemap and Markdown route.
- The footer link and its `siteSettings` field.
- The CTA and the `#share` opener with a placeholder panel. No agent yet.

### Slice 3: the conversation

- `workflows/testimonial.ts` up to `submit`, with the idle timeout.
- The routes: chat, message, stream, upload, photo; the `proxy.ts` exclusion for the decision route lands in slice 4.
- The chat island, the widgets and the draft card.
- BotID and the rate limit.
- `lib/email/send.ts` with the logging adapter; `sendCode` and `verifyCode` work locally without Resend.
- `scripts/eval-identify.ts`, run by hand against the labelled set, never in CI; it calls the same analysis as `analysePhoto`.

### Slice 4: the decision

- The rest of the workflow: the hook, accept, reject, email, clean-up.
- `/api/testimonials/decision`, the `submission-decided` Function, the blueprint entry.
- Resend over `fetch` behind the same adapter.

### Slice 5: polish and proof

- Empty, error and offline states in the chat; keyboard and screen-reader pass (axe through Playwright).
- A Playwright run through the whole flow with the model mocked at the step boundary and the email adapter logging.
- Lighthouse on `/testimonials` with the chat closed: the same budget as the other static pages (`specs/E11-performance-verification.md`).

## Acceptance criteria

- [ ] `/testimonials` is prerendered; the build output shows it static, and the chat's JavaScript is not in its first load.
- [ ] `/testimonials#share` from the footer opens the chat ready to use, with no further click; opening it starts no run, the first photo or message does.
- [ ] A visitor can go from photo to submitted in one conversation, and a reload in the middle resumes it.
- [ ] A photo of a catalogue product with its mark visible is identified and confirmed; a black item without the mark, or with the triangle pointing down, is not matched; a photo of something else leads to one retry, then the picker; the submission records which.
- [ ] An unsafe or unusable photo never reaches Sanity or an editor.
- [ ] A name or quote with abusive words is refused with a request to rephrase.
- [ ] The published quote is exactly the text the visitor approved.
- [ ] The email is verified by code before submit, never published, and gone from the submission after the decision.
- [ ] Anonymous GROQ returns nothing for `testimonialSubmission`.
- [ ] Accept publishes a testimonial with the photo in Sanity; it appears on the product page, the wall and in the favourites ranking without a redeploy.
- [ ] Reject sends the email with the reason; the blob is deleted after either decision and after an abandoned conversation.
- [ ] Off-topic requests are declined.
- [ ] No secret is prefixed `NEXT_PUBLIC_`, sent to the browser or logged.
- [ ] `pnpm verify` passes.

## Deferred

- One pending submission per email.
- Editing an accepted testimonial's text in the Studio with the submitter's consent.
- Several photos per submission.
- Languages other than English.
