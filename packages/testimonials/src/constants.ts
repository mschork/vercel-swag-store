/**
 * The testimonial agent's numbers and vocabularies
 * (specs/E25-testimonial-agent.md). Plain values only: the Studio imports this
 * file, so nothing here may pull in Node built-ins.
 */

/**
 * AI Gateway model id for the photo analysis, the text check and the agent.
 * A vision model that AI Gateway's free tier serves; the free tier refuses
 * newer ones.
 */
export const MODEL = 'google/gemini-2.5-flash'

/**
 * The store's mark, stated once for every prompt that looks for it. Every
 * product carries it, and colour does not tell the products apart.
 */
export const MARK_DESCRIPTION =
  'a solid white equilateral triangle pointing upward, printed on a black item. ' +
  'It can be large (a book cover) or small (a pen clip, a sock cuff).'

/**
 * A candidate counts only at or above this confidence, and only with the
 * mark visible. The model's confidence is flat once it sees the mark, so the
 * mark decides.
 */
export const PRODUCT_CONFIDENCE = 0.8
/** Candidates the analysis may name; the confirm widget shows the rest under "Pick another". */
export const MAX_CANDIDATES = 3
/** Below this quality score a photo is unusable. */
export const MIN_QUALITY_SCORE = 0.5

/** Uploads per run, whatever the reason for a retry. */
export const MAX_PHOTO_ATTEMPTS = 2
/** The longer edge the browser downsizes a photo to before upload, in pixels. */
export const MAX_PHOTO_EDGE = 1600
export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024
/** The browser aborts an upload after this, because a refused request is retried silently. */
export const UPLOAD_TIMEOUT_SECONDS = 30

/** The longest message a visitor may type in the chat. */
export const MESSAGE_MAX_LENGTH = 1000

/** The same limit the `testimonial` schema puts on its quote. */
export const QUOTE_MAX_LENGTH = 240
export const NAME_MAX_LENGTH = 60

export const CODE_LENGTH = 6
export const CODE_TTL_MINUTES = 10
export const CODE_MAX_ATTEMPTS = 5
export const CODE_RESEND_SECONDS = 30

/** Model turns per run; far below the 25,000 events a run may hold. */
export const MAX_TURNS = 20
/**
 * Model calls in one turn. Each server tool the run executes costs one more,
 * so this bounds a model that keeps calling them without asking the visitor.
 */
export const MAX_MODEL_CALLS_PER_TURN = 6
/** A conversation idle this long before submit ends, and its blobs are deleted. */
export const IDLE_TIMEOUT = '30m'

/** Testimonials per page of the wall at `/testimonials`. */
export const WALL_PAGE_SIZE = 24

/**
 * The Firewall rate-limit rule the chat, message and upload routes check. Its
 * window and limit are set to these by hand in the Vercel dashboard.
 */
export const RATE_LIMIT_RULE = 'testimonials'
export const RATE_LIMIT_WINDOW = '60s'
export const RATE_LIMIT_REQUESTS = 30

/** The least length of `TESTIMONIAL_PHOTO_SECRET` and `TESTIMONIAL_DECISION_SECRET`. */
export const MIN_SECRET_LENGTH = 32

export const SUBMISSION_TYPE = 'testimonialSubmission'
export const TESTIMONIAL_TYPE = 'testimonial'
/** The hook each turn of a conversation waits on, followed by its run id. */
export const TURN_HOOK_PREFIX = 'testimonial-turn:'
/** The hook a submitted run waits on, followed by its run id. */
export const REVIEW_HOOK_PREFIX = 'testimonial-review:'
/** Blob pathnames are `testimonials/<runId>/<attempt>.jpg`. */
export const BLOB_PREFIX = 'testimonials/'

export const SUBMISSION_STATUSES = ['pending', 'accepted', 'rejected'] as const
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]

export const REJECTION_REASONS = ['photo', 'product', 'content', 'other'] as const
export type RejectionReason = (typeof REJECTION_REASONS)[number]

/** Who named the product: the analysis, confirmed by the visitor, or the visitor's own pick. */
export const PRODUCT_SOURCES = ['agent', 'visitor'] as const
export type ProductSource = (typeof PRODUCT_SOURCES)[number]

export const QUALITY_ISSUES = ['blurred', 'too-dark', 'too-small', 'item-cut-off', 'no-item'] as const
export type QualityIssue = (typeof QUALITY_ISSUES)[number]

/** Tools the browser answers with a widget. */
export const CLIENT_TOOLS = [
  'askPhoto',
  'confirmProduct',
  'askName',
  'reviewQuote',
  'askConsent',
  'askEmail',
  'askCode',
] as const
export type ClientTool = (typeof CLIENT_TOOLS)[number]

/**
 * Tools the run executes itself, with the draft as it stands. None has an
 * `execute` on the agent, so the model's arguments never reach them.
 */
export const SERVER_TOOLS = ['analysePhoto', 'checkText', 'sendCode', 'verifyCode', 'submit'] as const
export type ServerTool = (typeof SERVER_TOOLS)[number]

/** The facts a submission needs, in the order the draft card lists them. */
export const DRAFT_FACTS = ['photo', 'product', 'name', 'quote', 'consent', 'email'] as const
export type DraftFact = (typeof DRAFT_FACTS)[number]
