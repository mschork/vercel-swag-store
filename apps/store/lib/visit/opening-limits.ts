/**
 * The two time limits of an opening draw (CONTEXT.md), side by side because
 * the first has to stay below the second: the server stops waiting for the API
 * before the browser stops waiting for the stock hole. The browser's clock
 * starts later, so a number in the HTML never arrives after the visit has been
 * opened without it (specs/E21-first-visit.md).
 */
export const OPENING_DRAW_DEADLINE_MS = 2000
export const OPENING_DRAW_WAIT_MS = 5000

/**
 * On the stock area while an opening draw is pending or present, so the seed
 * can tell from the HTML, before the hole hydrates, that one is coming.
 */
export const OPENING_DRAW_MARKER = 'data-opening-draw'
